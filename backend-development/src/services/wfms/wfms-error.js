/**
 * WFMSError — custom error type untuk Workflow Management System.
 *
 * Setiap transisi state yang ditolak melempar WFMSError dengan `code` spesifik
 * supaya controller bisa map ke HTTP status & response code yang konsisten.
 *
 * Code yang dikenali:
 *   - NOT_FOUND               → 404
 *   - INVALID_TRANSITION      → 409 (transisi tidak ada di matrix)
 *   - UNAUTHORIZED_ROLE       → 403 (role / ownership tidak memenuhi)
 *   - PRECONDITION_FAILED     → 409 (preconditions tidak terpenuhi)
 *   - DP_UNPAID               → 409 (preconditions spesifik: DP belum dibayar)
 *   - MILESTONES_INCOMPLETE   → 409 (preconditions spesifik: ada milestone non-Done)
 *   - PROJECT_TERMINAL        → 409 (milestone tidak bisa diubah karena project Completed/Cancelled)
 */
class WFMSError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'WFMSError';
    this.code = code;
  }
}

const WFMS_ERROR_HTTP_STATUS = {
  NOT_FOUND: 404,
  UNAUTHORIZED_ROLE: 403,
  INVALID_TRANSITION: 409,
  PRECONDITION_FAILED: 409,
  DP_UNPAID: 409,
  MILESTONES_INCOMPLETE: 409,
  PROJECT_TERMINAL: 409
};

const httpStatusForWFMSError = (err) =>
  WFMS_ERROR_HTTP_STATUS[err?.code] ?? 500;

module.exports = {
  WFMSError,
  httpStatusForWFMSError
};
