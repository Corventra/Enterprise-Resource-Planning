import { PdfDocumentField, type PdfDocumentFieldProps } from '../../../../components/ui/pdf-document-field';

const ACCEPTED_PAYMENT_PROOF_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const isAcceptedPaymentProofFile = (file: File) => {
  const mime = (file.type || '').toLowerCase();
  if (ACCEPTED_PAYMENT_PROOF_TYPES.has(mime)) {
    return true;
  }
  return /\.(pdf|jpe?g|png|webp)$/i.test(file.name);
};

export type InvoicePaymentProofFieldProps = PdfDocumentFieldProps;

/**
 * Wrapper bukti pembayaran invoice: UX sama proposal/EL, format sesuai backend (PDF/gambar, maks. 10 MB).
 */
export const InvoicePaymentProofField = ({
  existingDocumentDescription = 'Bukti pembayaran saat ini',
  clearPendingAriaLabel = 'Hapus bukti pembayaran',
  emptyStateExampleHint = 'contoh: bukti-transfer-termin-1.pdf',
  accept = 'application/pdf,.pdf,image/jpeg,image/png,image/webp',
  isAcceptedFile = isAcceptedPaymentProofFile,
  formatHint = 'PDF atau gambar JPG/PNG/WEBP — maks. 10 MB',
  ...rest
}: InvoicePaymentProofFieldProps) => (
  <PdfDocumentField
    existingDocumentDescription={existingDocumentDescription}
    clearPendingAriaLabel={clearPendingAriaLabel}
    emptyStateExampleHint={emptyStateExampleHint}
    accept={accept}
    isAcceptedFile={isAcceptedFile}
    formatHint={formatHint}
    {...rest}
  />
);
