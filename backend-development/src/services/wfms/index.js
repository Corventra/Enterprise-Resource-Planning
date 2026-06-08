/**
 * WFMS (Workflow Management System) — public entry point.
 *
 * Modul ini adalah **central rule engine** untuk semua perubahan state
 * project & milestone di sistem Corventra. Semua transisi state wajib
 * melalui service ini — tidak ada UPDATE langsung ke kolom `status` dari
 * controller atau repository.
 *
 * Struktur:
 *   - state-definitions.js  : enum + transition matrix
 *   - transition-service.js : core `transitionProject()`, `transitionMilestone()`
 *   - preconditions.js      : helper cek DP paid, all milestones done, dll.
 *   - authorization.js      : helper cek role / ownership
 *   - audit-logger.js       : INSERT row ke audit tables; fetch combined trail
 *   - wfms-error.js         : custom error class dengan code spesifik
 *
 * Lihat PRD-WFMS-Final-v1.2.md untuk dokumentasi lengkap state machine,
 * transition rules, SOP digital, dan mapping ke skripsi.
 */

const stateDefinitions = require('./state-definitions');
const transitionService = require('./transition-service');
const preconditions = require('./preconditions');
const authorization = require('./authorization');
const auditLogger = require('./audit-logger');
const { WFMSError, httpStatusForWFMSError } = require('./wfms-error');

module.exports = {
  // State definitions
  ...stateDefinitions,

  // Core API
  ...transitionService,

  // Helpers (re-export untuk akses langsung dari controller bila perlu)
  preconditions,
  authorization,
  auditLogger,

  // Error
  WFMSError,
  httpStatusForWFMSError
};
