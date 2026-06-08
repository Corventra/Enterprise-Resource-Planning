/**
 * WFMS State Definitions — single source of truth untuk state machine sistem.
 *
 * Berisi:
 *   1. Enum nilai state untuk entitas `projects` (5 status) dan
 *      `project_milestones` (4 status).
 *   2. Transition matrix yang menentukan transisi mana yang allowed.
 *
 * Mengubah file ini berarti mengubah workflow sistem — semua sub-modul WFMS
 * (transition-service, preconditions, authorization, audit-logger) wajib
 * konsisten dengan definisi di sini.
 *
 * Catatan: Initial creation (dari "tidak ada" ke 'Awaiting Consultant')
 * diperlakukan sebagai transisi resmi dengan from_status = NULL. Pola ini
 * mengikuti konvensi Camunda / AASM untuk *initial transition*.
 */

// =============================================================
// Project States & Transition Matrix
// =============================================================

const PROJECT_STATES = Object.freeze({
  AWAITING_CONSULTANT: 'Awaiting Consultant',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
});

const PROJECT_STATES_LIST = Object.freeze(Object.values(PROJECT_STATES));

/**
 * Project Transition Matrix.
 * Key: from_status (or null untuk initial creation).
 * Value: array of allowed to_status.
 *
 * Lihat PRD bagian 3.1.3 (Transition Matrix Project).
 */
const PROJECT_TRANSITION_MATRIX = Object.freeze({
  // Initial creation: dari "tidak ada" state → Awaiting Consultant
  null: ['Awaiting Consultant'],

  'Awaiting Consultant': ['In Progress', 'On Hold', 'Cancelled'],
  'In Progress':         ['On Hold', 'Completed', 'Cancelled'],
  'On Hold':             ['In Progress', 'Cancelled'],
  'Completed':           [],   // terminal
  'Cancelled':           []    // terminal
});

// =============================================================
// Milestone States & Transition Matrix
// =============================================================

const MILESTONE_STATES = Object.freeze({
  PENDING:     'Pending',
  IN_PROGRESS: 'In Progress',
  DONE:        'Done',
  BLOCKED:     'Blocked'
});

const MILESTONE_STATES_LIST = Object.freeze(Object.values(MILESTONE_STATES));

const MILESTONE_TRANSITION_MATRIX = Object.freeze({
  'Pending':     ['In Progress', 'Blocked'],
  'In Progress': ['Done', 'Blocked'],
  'Done':        ['In Progress'],            // reopen by PM
  'Blocked':     ['In Progress']             // unblock
});

// =============================================================
// Public predicates
// =============================================================

/**
 * Cek apakah transisi (fromStatus → toStatus) allowed untuk entity tertentu.
 *
 * @param {'project'|'milestone'} entity
 * @param {string|null} fromStatus  Null untuk initial creation (project only).
 * @param {string} toStatus
 * @returns {boolean}
 */
const isAllowedTransition = (entity, fromStatus, toStatus) => {
  const matrix = entity === 'project'
    ? PROJECT_TRANSITION_MATRIX
    : entity === 'milestone'
      ? MILESTONE_TRANSITION_MATRIX
      : null;
  if (!matrix) return false;

  const allowed = matrix[fromStatus === null ? 'null' : fromStatus];
  if (!allowed) return false;
  return allowed.includes(toStatus);
};

/**
 * Cek apakah status valid untuk entity.
 */
const isValidStatus = (entity, status) => {
  if (entity === 'project') return PROJECT_STATES_LIST.includes(status);
  if (entity === 'milestone') return MILESTONE_STATES_LIST.includes(status);
  return false;
};

const isTerminalProjectStatus = (status) =>
  status === PROJECT_STATES.COMPLETED || status === PROJECT_STATES.CANCELLED;

module.exports = {
  PROJECT_STATES,
  PROJECT_STATES_LIST,
  PROJECT_TRANSITION_MATRIX,
  MILESTONE_STATES,
  MILESTONE_STATES_LIST,
  MILESTONE_TRANSITION_MATRIX,
  isAllowedTransition,
  isValidStatus,
  isTerminalProjectStatus
};
