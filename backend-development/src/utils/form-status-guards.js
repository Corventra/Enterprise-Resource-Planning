const { ValidationError } = require('./validation');

/**
 * Mutasi struktur form (metadata PATCH, field CRUD, option CRUD) hanya saat status DRAFT.
 * @param {{ status: string }} formRow — row form atau objek dengan `status` (mis. dari join field).
 */
function requireDraftForFormWrites(formRow) {
  const status = formRow.status;
  if (status === 'DRAFT') return;
  if (status === 'PUBLISHED') {
    throw new ValidationError('Form published tidak bisa diubah.');
  }
  if (status === 'INACTIVE') {
    throw new ValidationError('Form inactive tidak bisa diubah.');
  }
  throw new ValidationError('Form hanya bisa diubah saat masih draft.');
}

module.exports = {
  requireDraftForFormWrites
};
