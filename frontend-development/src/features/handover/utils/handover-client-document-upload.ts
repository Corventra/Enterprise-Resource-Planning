const ACCEPTED_HANDOVER_CLIENT_DOC_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png'
]);

export const HANDOVER_CLIENT_DOC_ACCEPT =
  'application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,application/vnd.ms-excel,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx,image/jpeg,.jpg,.jpeg,image/png,.png';

export const HANDOVER_CLIENT_DOC_FORMAT_HINT = 'PDF, Word, Excel, JPG/PNG — maks. 20 MB per file';

export const isAcceptedHandoverClientDocument = (file: File) => {
  const mime = (file.type || '').toLowerCase();
  if (ACCEPTED_HANDOVER_CLIENT_DOC_MIMES.has(mime)) {
    return true;
  }
  return /\.(pdf|doc|docx|xls|xlsx|jpe?g|png)$/i.test(file.name);
};
