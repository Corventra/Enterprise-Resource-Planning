import { PdfDocumentField, type PdfDocumentFieldProps } from '../../../../components/ui/pdf-document-field';

export type ProposalDocumentFieldProps = PdfDocumentFieldProps;

/**
 * Wrapper proposal: default teks/aria untuk dokumen proposal (komponen generik: {@link PdfDocumentField}).
 */
export const ProposalDocumentField = ({
  existingDocumentDescription = 'Dokumen proposal saat ini',
  clearPendingAriaLabel = 'Hapus file proposal',
  ...rest
}: ProposalDocumentFieldProps) => (
  <PdfDocumentField
    existingDocumentDescription={existingDocumentDescription}
    clearPendingAriaLabel={clearPendingAriaLabel}
    {...rest}
  />
);
