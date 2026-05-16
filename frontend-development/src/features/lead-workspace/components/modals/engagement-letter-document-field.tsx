import { PdfDocumentField, type PdfDocumentFieldProps } from '../../../../components/ui/pdf-document-field';

export type EngagementLetterDocumentFieldProps = PdfDocumentFieldProps;

/**
 * Wrapper engagement letter: default teks/aria untuk dokumen EL (komponen generik: {@link PdfDocumentField}).
 */
export const EngagementLetterDocumentField = ({
  existingDocumentDescription = 'Dokumen engagement letter saat ini',
  clearPendingAriaLabel = 'Hapus file engagement letter',
  emptyStateExampleHint = 'contoh: EL_PtMakmurJaya_2026.pdf',
  ...rest
}: EngagementLetterDocumentFieldProps) => (
  <PdfDocumentField
    existingDocumentDescription={existingDocumentDescription}
    clearPendingAriaLabel={clearPendingAriaLabel}
    emptyStateExampleHint={emptyStateExampleHint}
    {...rest}
  />
);
