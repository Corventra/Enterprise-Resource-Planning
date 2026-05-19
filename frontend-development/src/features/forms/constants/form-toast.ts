export const FORM_TOAST = {
  titleRequired: 'Judul form wajib diisi.',
  descriptionRequired: 'Deskripsi form wajib diisi.',
  successMessageRequired: 'Success message wajib diisi.',
  draftSaved: 'Draft form berhasil disimpan.',
  published: 'Form berhasil dipublish.',
  paused: 'Form dijeda — respons baru ditangguhkan.',
  resumed: 'Form dilanjutkan — respons baru diterima kembali.',
  linkCopied: (label: string) => `${label} berhasil disalin.`,
  linkCopyFailed: 'Gagal menyalin ke clipboard.',
  qrDownloaded: 'QR code berhasil diunduh.',
  qrDownloadFailed: 'Gagal mengunduh QR code.',
  deleted: 'Form berhasil dihapus.'
} as const;
