/**
 * WFMS Authorization — cek apakah aktor (user) berhak melakukan transisi state
 * yang diminta.
 *
 * Catatan: route-level permission (mis. PROJECT_VIEW, PROJECT_MANAGE) sudah
 * dijaga di middleware. Authorization di sini fokus pada **ownership** dan
 * **role-spesifik transition** yang tidak bisa di-cover oleh permission generic.
 *
 * Lihat PRD bagian 3.1.4 (Transition Rules Project) dan 3.2.4 (Transition
 * Rules Milestone) untuk daftar aktor per transisi.
 */

const { PROJECT_STATES } = require('./state-definitions');

// =============================================================
// Helpers
// =============================================================

const isPmOf = (user, project) =>
  Number(project?.pm_user_id) === Number(user?.id);

const isOwnerOf = (user, milestone) =>
  Number(milestone?.owner_user_id) === Number(user?.id);

const hasRole = (user, ...roles) =>
  roles.includes(String(user?.role_code || '').toUpperCase());

// =============================================================
// Project authorization
// =============================================================

/**
 * Cek apakah user boleh melakukan transisi project tertentu.
 *
 * @param {object} user      { id, role_code }
 * @param {object} project   { project_id, pm_user_id, status }
 * @param {string|null} fromStatus
 * @param {string} toStatus
 * @returns {boolean}
 */
const isAuthorizedForProjectTransition = (user, project, fromStatus, toStatus) => {
  if (!user) return false;

  // TP1: (init) → Awaiting Consultant — aktor COO atau Superadmin
  if (fromStatus === null && toStatus === PROJECT_STATES.AWAITING_CONSULTANT) {
    return hasRole(user, 'COO', 'SUPERADMIN');
  }

  // TP2 / TP2-alt: → In Progress
  //   - Awaiting Consultant → In Progress (initial start): PM-of-project atau COO
  //   - On Hold → In Progress (resume, part of UC Mengelola Status): PM-of-project atau COO
  if (toStatus === PROJECT_STATES.IN_PROGRESS) {
    return (
      isPmOf(user, project) ||
      hasRole(user, 'COO', 'SUPERADMIN')
    );
  }

  // TP3: In Progress → On Hold (pause, UC Mengelola Status) — PM-of-project atau COO
  if (toStatus === PROJECT_STATES.ON_HOLD) {
    return (
      isPmOf(user, project) ||
      hasRole(user, 'COO', 'SUPERADMIN')
    );
  }

  // TP5: In Progress/On Hold → Completed — strict PM ownership
  if (toStatus === PROJECT_STATES.COMPLETED) {
    return isPmOf(user, project) || hasRole(user, 'SUPERADMIN');
  }

  // TP6: * → Cancelled (UC Mengelola Status) — PM-of-project atau COO
  if (toStatus === PROJECT_STATES.CANCELLED) {
    return (
      isPmOf(user, project) ||
      hasRole(user, 'COO', 'SUPERADMIN')
    );
  }

  return false;
};

// =============================================================
// Milestone authorization
// =============================================================

/**
 * Cek apakah user boleh melakukan transisi milestone.
 *
 * Aturan dasar:
 *   - TM1–TM4: owner milestone ATAU PM project boleh
 *   - TM5 (Done → In Progress, reopen): PM only
 *   - TM6 (rate, no status change): PM only
 *
 * @param {object} user
 * @param {object} milestone   { milestone_id, owner_user_id }
 * @param {object} project     { project_id, pm_user_id }
 * @param {string} fromStatus
 * @param {string} toStatus
 */
const isAuthorizedForMilestoneTransition = (
  user,
  milestone,
  project,
  fromStatus,
  toStatus
) => {
  if (!user) return false;

  // TM5: Done → In Progress (reopen) — strict PM
  if (fromStatus === 'Done' && toStatus === 'In Progress') {
    return isPmOf(user, project) || hasRole(user, 'SUPERADMIN');
  }

  // TM1–TM4: owner milestone ATAU PM project
  if (isOwnerOf(user, milestone) || isPmOf(user, project)) return true;
  if (hasRole(user, 'SUPERADMIN')) return true;

  return false;
};

/**
 * Authorization untuk rateMilestone (no status change, hanya update rating).
 * Aktor harus PM project.
 */
const isAuthorizedForMilestoneRating = (user, project) =>
  isPmOf(user, project) || hasRole(user, 'SUPERADMIN');

module.exports = {
  isPmOf,
  isOwnerOf,
  hasRole,
  isAuthorizedForProjectTransition,
  isAuthorizedForMilestoneTransition,
  isAuthorizedForMilestoneRating
};
