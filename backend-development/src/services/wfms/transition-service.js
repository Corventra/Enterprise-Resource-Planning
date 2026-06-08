/**
 * WFMS Transition Service — **central rule engine** untuk semua perubahan
 * state project dan milestone di sistem.
 *
 * Setiap perubahan status WAJIB melewati `transitionProject()` atau
 * `transitionMilestone()` di file ini — tidak boleh `UPDATE projects.status`
 * atau `UPDATE project_milestones.status` langsung dari controller.
 *
 * Setiap call menjalankan 7 langkah berurutan dalam satu transaction
 * (transaksi di-manage di caller):
 *   1. SELECT FOR UPDATE lock — prevent race condition
 *   2. Matrix check          — apakah transisi allowed?
 *   3. Authorization         — apakah user berhak?
 *   4. Preconditions         — apakah kondisi terpenuhi?
 *   5. Execute UPDATE        — apply state change
 *   6. Audit log             — INSERT ke project_status_transitions /
 *                              project_milestone_updates
 *   7. Side effects          — trigger final invoice, dll (di caller / hook)
 *
 * Lihat PRD bagian 10.2 untuk pseudocode reference.
 */

const { WFMSError } = require('./wfms-error');
const { isAllowedTransition } = require('./state-definitions');
const {
  isAuthorizedForProjectTransition,
  isAuthorizedForMilestoneTransition
} = require('./authorization');
const {
  checkProjectPreconditions,
  checkMilestonePreconditions
} = require('./preconditions');
const {
  logProjectTransition,
  logMilestoneTransition
} = require('./audit-logger');

// =============================================================
// Project transition
// =============================================================

/**
 * Eksekusi transisi state project. Wajib dipanggil di dalam transaction
 * yang sudah di-begin di caller (caller juga yang commit / rollback).
 *
 * @param {object} conn       mysql2 connection (di dalam transaction)
 * @param {object} params
 * @param {number} params.projectId
 * @param {string} params.toStatus
 * @param {object} params.actor                  { id, role_code, name? }
 * @param {string|null} [params.reason]
 * @param {'USER'|'SYSTEM'} [params.triggerSource='USER']
 * @param {boolean} [params.skipPreconditions=false]  Untuk SYSTEM-trigger yang
 *   sudah melakukan precondition check sendiri (mis. cron).
 *
 * @returns {Promise<{
 *   noop: boolean,
 *   fromStatus: string|null,
 *   toStatus: string,
 *   transitionId?: number,
 *   project: object
 * }>}
 *
 * @throws {WFMSError} dengan code spesifik (lihat wfms-error.js).
 */
const transitionProject = async (conn, params) => {
  const {
    projectId,
    toStatus,
    actor,
    reason = null,
    triggerSource = 'USER',
    skipPreconditions = false
  } = params;

  // STEP 1: SELECT FOR UPDATE lock — fetch project + handover info (DP status)
  const [[project]] = await conn.query(
    `SELECT
       p.project_id,
       p.project_code,
       p.handover_id,
       p.status,
       p.pm_user_id,
       p.end_date,
       h.dp_payment_status
     FROM projects p
     INNER JOIN handovers h ON h.handover_id = p.handover_id
     WHERE p.project_id = ?
     FOR UPDATE`,
    [projectId]
  );
  if (!project) {
    throw new WFMSError('NOT_FOUND', 'Project tidak ditemukan.');
  }

  const fromStatus = project.status;
  if (fromStatus === toStatus) {
    // Idempotent — no-op, no audit log
    return { noop: true, fromStatus, toStatus, project };
  }

  // STEP 2: Matrix check
  if (!isAllowedTransition('project', fromStatus, toStatus)) {
    throw new WFMSError(
      'INVALID_TRANSITION',
      `Transisi project dari ${fromStatus} ke ${toStatus} tidak diperbolehkan.`
    );
  }

  // STEP 3: Authorization
  if (!isAuthorizedForProjectTransition(actor, project, fromStatus, toStatus)) {
    throw new WFMSError(
      'UNAUTHORIZED_ROLE',
      `Role ${actor?.role_code || 'unknown'} tidak boleh transisi project ke ${toStatus}.`
    );
  }

  // STEP 4: Preconditions
  if (!skipPreconditions) {
    const pre = await checkProjectPreconditions(conn, project, toStatus);
    if (!pre.passed) {
      throw new WFMSError(pre.code || 'PRECONDITION_FAILED', pre.message);
    }
  }

  // STEP 5: Execute UPDATE
  await conn.query(
    `UPDATE projects SET status = ?, updated_at = NOW() WHERE project_id = ?`,
    [toStatus, projectId]
  );

  // STEP 6: Audit log
  const transitionId = await logProjectTransition(conn, {
    projectId,
    fromStatus,
    toStatus,
    userId: actor?.id || null,
    userNameSnapshot: actor?.name || null,
    triggerSource,
    reason
  });

  // STEP 7: Side effects → di caller (mis. trigger final invoice di
  // completeProject controller). Function ini sengaja tidak handle side effect
  // supaya tidak coupling dengan modul lain.

  return {
    noop: false,
    fromStatus,
    toStatus,
    transitionId,
    project: { ...project, status: toStatus }
  };
};

/**
 * Log row creation event untuk project baru (initial transition dari null →
 * 'Awaiting Consultant'). Dipanggil setelah INSERT projects di createFromHandover.
 *
 * Tidak melalui matrix/authorization check karena ini adalah inisialisasi
 * (project belum exists saat dicek). Permission untuk create sudah dijaga di
 * route middleware.
 */
const logProjectCreation = async (conn, { projectId, actor, reason }) =>
  logProjectTransition(conn, {
    projectId,
    fromStatus: null,
    toStatus: 'Awaiting Consultant',
    userId: actor?.id || null,
    userNameSnapshot: actor?.name || null,
    triggerSource: 'SYSTEM',
    reason: reason || 'Project created from handover'
  });

// =============================================================
// Milestone transition
// =============================================================

/**
 * Eksekusi transisi state milestone. Wajib dipanggil di dalam transaction.
 *
 * @param {object} conn
 * @param {object} params
 * @param {number} params.projectId
 * @param {number} params.milestoneId
 * @param {string} params.toStatus
 * @param {object} params.actor              { id, role_code, name? }
 * @param {string|null} [params.note]
 *
 * @returns {Promise<{
 *   noop: boolean,
 *   fromStatus: string,
 *   toStatus: string,
 *   completedAt: Date|null,
 *   updateId?: number
 * }>}
 */
const transitionMilestone = async (conn, params) => {
  const { projectId, milestoneId, toStatus, actor, note = null } = params;

  // STEP 1: Lock milestone + parent project
  const [[milestone]] = await conn.query(
    `SELECT
       m.milestone_id, m.project_id, m.status, m.owner_user_id, m.completed_at,
       p.pm_user_id, p.status AS project_status
     FROM project_milestones m
     INNER JOIN projects p ON p.project_id = m.project_id
     WHERE m.milestone_id = ? AND m.project_id = ?
     FOR UPDATE`,
    [milestoneId, projectId]
  );
  if (!milestone) {
    throw new WFMSError('NOT_FOUND', 'Milestone tidak ditemukan di project ini.');
  }

  const fromStatus = milestone.status;
  if (fromStatus === toStatus) {
    return { noop: true, fromStatus, toStatus, completedAt: milestone.completed_at };
  }

  // STEP 2: Matrix check
  if (!isAllowedTransition('milestone', fromStatus, toStatus)) {
    throw new WFMSError(
      'INVALID_TRANSITION',
      `Transisi milestone dari ${fromStatus} ke ${toStatus} tidak diperbolehkan.`
    );
  }

  // STEP 3: Authorization
  const projectSnapshot = {
    project_id: milestone.project_id,
    pm_user_id: milestone.pm_user_id
  };
  if (!isAuthorizedForMilestoneTransition(actor, milestone, projectSnapshot, fromStatus, toStatus)) {
    throw new WFMSError(
      'UNAUTHORIZED_ROLE',
      'Hanya owner milestone atau PM project yang boleh update status milestone ini.'
    );
  }

  // STEP 4: Preconditions (cross-entity: project tidak boleh terminal)
  const pre = await checkMilestonePreconditions(
    conn,
    milestone,
    { project_id: milestone.project_id, status: milestone.project_status },
    toStatus
  );
  if (!pre.passed) {
    throw new WFMSError(pre.code || 'PRECONDITION_FAILED', pre.message);
  }

  // STEP 5: Execute UPDATE — handle completed_at auto-set/clear
  let newCompletedAt = milestone.completed_at;
  if (toStatus === 'Done') {
    newCompletedAt = newCompletedAt ?? new Date();
  } else if (fromStatus === 'Done') {
    newCompletedAt = null;
  }
  await conn.query(
    `UPDATE project_milestones SET status = ?, completed_at = ? WHERE milestone_id = ?`,
    [toStatus, newCompletedAt, milestoneId]
  );

  // STEP 6: Audit log
  const updateId = await logMilestoneTransition(conn, {
    milestoneId,
    fromStatus,
    toStatus,
    userId: actor?.id || null,
    userNameSnapshot: actor?.name || null,
    note
  });

  // STEP 7: Side effects → tidak ada di milestone level untuk saat ini.
  // KPI recompute terjadi on-demand di dashboard query.

  return {
    noop: false,
    fromStatus,
    toStatus,
    completedAt: newCompletedAt,
    updateId
  };
};

module.exports = {
  transitionProject,
  logProjectCreation,
  transitionMilestone
};
