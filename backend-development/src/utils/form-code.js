/**
 * Generate kode form konsisten dengan pola campaign: frm- + nol di depan (min 3 digit).
 */
const formatFormCode = (formId) => `frm-${String(formId).padStart(3, '0')}`;

module.exports = { formatFormCode };
