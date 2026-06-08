/**
 * WFMS Audit Logger — helper untuk INSERT row append-only ke audit tables.
 *
 * Dua tabel audit:
 *   - `project_status_transitions` (project-level, dibuat di migration 016)
 *   - `project_milestone_updates`  (milestone-level, sudah ada sejak migration 012)
 *
 * Audit log bersifat append-only — tidak ada endpoint UPDATE/DELETE yang
 * memodifikasi row di sini.
 */

/**
 * INSERT row baru di `project_status_transitions`.
 *
 * @param {object} conn               mysql2 connection (di dalam transaction)
 * @param {object} params
 * @param {number} params.projectId
 * @param {string|null} params.fromStatus    NULL untuk creation event
 * @param {string} params.toStatus
 * @param {number|null} params.userId        NULL untuk SYSTEM-triggered
 * @param {string} [params.userNameSnapshot] Snapshot nama user (optional)
 * @param {'USER'|'SYSTEM'} [params.triggerSource='USER']
 * @param {string|null} [params.reason]
 * @returns {Promise<number>} Insert ID baru.
 */
const logProjectTransition = async (conn, params) => {
  const {
    projectId,
    fromStatus,
    toStatus,
    userId = null,
    userNameSnapshot = null,
    triggerSource = 'USER',
    reason = null
  } = params;

  let snapshotName = userNameSnapshot;
  if (!snapshotName && userId) {
    const [[row]] = await conn.query(
      `SELECT name FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    snapshotName = row?.name || null;
  }

  const [result] = await conn.query(
    `INSERT INTO project_status_transitions
      (project_id, from_status, to_status,
       triggered_by_user_id, triggered_by_name_snapshot,
       trigger_source, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [projectId, fromStatus, toStatus, userId, snapshotName, triggerSource, reason]
  );
  return result.insertId;
};

/**
 * INSERT row baru di `project_milestone_updates`.
 *
 * @param {object} conn
 * @param {object} params
 * @param {number} params.milestoneId
 * @param {string} params.fromStatus
 * @param {string} params.toStatus
 * @param {number} params.userId
 * @param {string} [params.userNameSnapshot]
 * @param {string|null} [params.note]
 * @returns {Promise<number>}
 */
const logMilestoneTransition = async (conn, params) => {
  const {
    milestoneId,
    fromStatus,
    toStatus,
    userId,
    userNameSnapshot = null,
    note = null
  } = params;

  let snapshotName = userNameSnapshot;
  if (!snapshotName && userId) {
    const [[row]] = await conn.query(
      `SELECT name FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    snapshotName = row?.name || null;
  }

  const [result] = await conn.query(
    `INSERT INTO project_milestone_updates
      (milestone_id, by_user_id, by_name_snapshot, from_status, to_status, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [milestoneId, userId, snapshotName, fromStatus, toStatus, note]
  );
  return result.insertId;
};

/**
 * Fetch combined audit trail untuk satu project (project-level + milestone-level)
 * dalam urutan kronologis.
 *
 * @returns {Promise<Array<object>>}  Each row: {
 *   id, entity_type ('project'|'milestone'), entity_label, from_status,
 *   to_status, by_user_id, by_name, trigger_source, triggered_at, reason
 * }
 */
const fetchProjectAuditTrail = async (db, projectId) => {
  // 1. Project-level transitions
  const [projectRows] = await db.query(
    `SELECT
       pst.transition_id    AS id,
       'project'            AS entity_type,
       NULL                 AS entity_label,
       pst.from_status      AS from_status,
       pst.to_status        AS to_status,
       pst.triggered_by_user_id AS by_user_id,
       COALESCE(u.name, pst.triggered_by_name_snapshot) AS by_name,
       pst.trigger_source   AS trigger_source,
       pst.triggered_at     AS triggered_at,
       pst.reason           AS reason
     FROM project_status_transitions pst
     LEFT JOIN users u ON u.id = pst.triggered_by_user_id
     WHERE pst.project_id = ?
     ORDER BY pst.triggered_at ASC`,
    [projectId]
  );

  // 2. Milestone-level updates (join lewat milestone_id → project_id)
  const [milestoneRows] = await db.query(
    `SELECT
       upd.update_id        AS id,
       'milestone'          AS entity_type,
       m.title              AS entity_label,
       upd.from_status      AS from_status,
       upd.to_status        AS to_status,
       upd.by_user_id       AS by_user_id,
       COALESCE(u.name, upd.by_name_snapshot) AS by_name,
       'USER'               AS trigger_source,
       upd.at               AS triggered_at,
       upd.note             AS reason
     FROM project_milestone_updates upd
     INNER JOIN project_milestones m ON m.milestone_id = upd.milestone_id
     LEFT JOIN users u ON u.id = upd.by_user_id
     WHERE m.project_id = ?
     ORDER BY upd.at ASC`,
    [projectId]
  );

  // 3. Merge & sort by triggered_at ascending
  const combined = [...projectRows, ...milestoneRows].sort((a, b) => {
    const ta = new Date(a.triggered_at).getTime();
    const tb = new Date(b.triggered_at).getTime();
    return ta - tb;
  });

  return combined;
};

module.exports = {
  logProjectTransition,
  logMilestoneTransition,
  fetchProjectAuditTrail
};
