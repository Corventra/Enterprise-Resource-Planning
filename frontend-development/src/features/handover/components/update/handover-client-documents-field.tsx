import { FileText, X } from 'lucide-react';
import { formatDocumentFileSize, PdfDocumentField } from '../../../../components/ui/pdf-document-field';
import type { HandoverClientDocumentItem } from '../../types/handover.types';
import {
  HANDOVER_CLIENT_DOC_ACCEPT,
  HANDOVER_CLIENT_DOC_FORMAT_HINT,
  isAcceptedHandoverClientDocument
} from '../../utils/handover-client-document-upload';

interface HandoverClientDocumentsFieldProps {
  documents: HandoverClientDocumentItem[];
  disabled?: boolean;
  onAddFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
}

const HandoverClientDocumentRow = ({
  doc,
  disabled,
  onRemove
}: {
  doc: HandoverClientDocumentItem;
  disabled?: boolean;
  onRemove: () => void;
}) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="rounded-md bg-white p-2 shadow-sm">
          <FileText className="h-5 w-5 text-[#003c90]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900" title={doc.name}>
            {doc.name}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {doc.pendingFile
              ? `${formatDocumentFileSize(doc.pendingFile.size)} · Akan diunggah saat menyimpan`
              : doc.uploadedAt && doc.uploadedAt !== '-'
                ? doc.uploadedAt
                : 'Dokumen terunggah'}
          </p>
          {doc.downloadUrl && !doc.pendingFile ? (
            <a
              href={doc.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs font-semibold text-[#0f52ba] underline decoration-[#0f52ba]/50 underline-offset-2 hover:text-[#003c90]"
            >
              Buka dokumen
            </a>
          ) : null}
        </div>
      </div>
      {!disabled ? (
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
          aria-label={`Hapus dokumen ${doc.name}`}
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  </div>
);

export const HandoverClientDocumentsField = ({
  documents,
  disabled = false,
  onAddFiles,
  onRemove
}: HandoverClientDocumentsFieldProps) => (
  <div className="space-y-4">
    {documents.map((doc, index) => (
      <HandoverClientDocumentRow key={doc.id} doc={doc} disabled={disabled} onRemove={() => onRemove(index)} />
    ))}
    <PdfDocumentField
      multiple
      pendingFile={null}
      existingDocumentName={null}
      disabled={disabled}
      onSelectFile={() => {}}
      onSelectFiles={onAddFiles}
      onClearPending={() => {}}
      accept={HANDOVER_CLIENT_DOC_ACCEPT}
      isAcceptedFile={isAcceptedHandoverClientDocument}
      formatHint={HANDOVER_CLIENT_DOC_FORMAT_HINT}
      emptyStateTitle="Seret & lepas dokumen di sini, atau klik untuk memilih"
      emptyStateExampleHint="contoh: trial_balance_Q4.pdf"
      clearPendingAriaLabel="Hapus pilihan dokumen"
    />
  </div>
);
