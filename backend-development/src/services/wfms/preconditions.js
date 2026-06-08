/**
 * WFMS Preconditions — cek kondisi yang harus terpenuhi sebelum transisi state
 * boleh dieksekusi.
 *
 * Setiap function mengembalikan { passed: boolean, code?: string, message?: string }.
 * Untuk hasil gagal, controller / transition-service akan throw WFMSError
 * dengan code yang sama.
 *
 * Lihat PRD bagian 3.1.4 (Transition Rules Project) dan 3.2.4 (Transition Rules
 * Milestone) untuk daftar lengkap preconditions per transisi.
 */

const { PROJECT_STATES, isTerminalProjectStatus } = require('./state-definitions');

// =============================================================
// Project preconditions
// =============================================================

/**
 * Precondition untuk transisi Awaiting Consultant → In Progress:
 * DP klien harus sudah PAID.
 *
 * @param {{ dp_payment_status?: string|null }} project   Snapshot project +
 *   handover row (kolom dp_payment_status dari tabel handovers).
 */
const checkDpPaidForStart = (project) => {
  if (project?.dp_payment_status !== 'PAID') {
    return {
      passed: false,
      code: 'DP_UNPAID',
      message:
        'DP belum dibayar. Project belum boleh mulai — assign consultant ' +
        'akan tersedia setelah pembayaran DP dikonfirmasi.'
    };
  }
  return { passed: true };
};

/**
 * Precondition untuk transisi In Progress → Completed:
 * Semua milestone harus berstatus 'Done'.
 *
 * @param {object} conn  mysql2 connection (boleh pool atau pool.getConnection()).
 * @param {number} projectId
 */
const checkAllMilestonesDone = async (conn, projectId) => {
  const [rows] = await conn.query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) AS done_count
     FROM project_milestones
     WHERE project_id = ?`,
    [projectId]
  );
  const total = Number(rows[0]?.total ?? 0);
  const doneCount = Number(rows[0]?.done_count ?? 0);

  if (total === 0) {
    return {
      passed: false,
      code: 'PRECONDITION_FAILED',
      message: 'Project tidak punya milestone — tidak bisa dianggap Completed.'
    };
  }
  if (doneCount < total) {
    return {
      passed: false,
      code: 'MILESTONES_INCOMPLETE',
      message: `Masih ada ${total - doneCount} dari ${total} milestone yang belum Done.`
    };
  }
  return { passed: true };
};

/**
 * Aggregate precondition check untuk transisi project.
 */
const checkProjectPreconditions = async (conn, project, toStatus) => {
  // Awaiting Consultant → In Progress: DP harus PAID
  if (
    project.status === PROJECT_STATES.AWAITING_CONSULTANT &&
    toStatus === PROJECT_STATES.IN_PROGRESS
  ) {
    return checkDpPaidForStart(project);
  }

  // On Hold → In Progress: DP harus PAID (konsisten dengan TP2 rule)
  if (
    project.status === PROJECT_STATES.ON_HOLD &&
    toStatus === PROJECT_STATES.IN_PROGRESS
  ) {
    return checkDpPaidForStart(project);
  }

  // In Progress / On Hold → Completed: semua milestone harus Done
  if (toStatus === PROJECT_STATES.COMPLETED) {
    return checkAllMilestonesDone(conn, project.project_id);
  }

  return { passed: true };
};

// =============================================================
// Milestone preconditions
// =============================================================

/**
 * Cross-entity precondition: milestone tidak boleh diubah jika project parent
 * sudah terminal (Completed atau Cancelled).
 *
 * Lihat PRD bagian 3.2.4 "Cross-Entity Precondition".
 *
 * @param {{ status: string }} parentProject  Snapshot project parent.
 */
const checkProjectNotTerminal = (parentProject) => {
  if (!parentProject) return { passed: true };
  if (isTerminalProjectStatus(parentProject.status)) {
    return {
      passed: false,
      code: 'PROJECT_TERMINAL',
      message:
        `Project parent berstatus ${parentProject.status} — milestone tidak ` +
        'dapat diubah.'
    };
  }
  return { passed: true };
};

/**
 * Aggregate precondition check untuk transisi milestone.
 *
 * @param {object} conn
 * @param {{ milestone_id: number, status: string }} milestone
 * @param {{ project_id: number, status: string }} parentProject
 * @param {string} toStatus
 */
const checkMilestonePreconditions = async (conn, milestone, parentProject, toStatus) => {
  // Cross-entity: project parent tidak boleh terminal
  const parentCheck = checkProjectNotTerminal(parentProject);
  if (!parentCheck.passed) return parentCheck;

  return { passed: true };
};

module.exports = {
  checkDpPaidForStart,
  checkAllMilestonesDone,
  checkProjectPreconditions,
  checkProjectNotTerminal,
  checkMilestonePreconditions
};
