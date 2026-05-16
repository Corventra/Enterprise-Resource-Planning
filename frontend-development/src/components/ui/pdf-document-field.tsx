import { FileText, Upload, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';

export interface PdfDocumentFieldProps {
  pendingFile: File | null;
  existingDocumentName?: string | null;
  disabled?: boolean;
  onSelectFile: (file: File | null) => void;
  onClearPending: () => void;
  /** Teks baris kedua saat menampilkan dokumen yang sudah ada (tanpa file baru dipilih). */
  existingDocumentDescription?: string;
  /** Aksesibilitas tombol hapus pilihan file baru. */
  clearPendingAriaLabel?: string;
  /** Contoh nama file di area kosong (opsional). */
  emptyStateExampleHint?: string;
  /** Atribut accept pada input file. */
  accept?: string;
  /** Validasi tipe file; default hanya PDF. */
  isAcceptedFile?: (file: File) => boolean;
  /** Teks bantuan format di area kosong. */
  formatHint?: string;
}

const ACCEPTED_PDF_TYPES = new Set(['application/pdf']);

const isAcceptedPdfFile = (file: File) => {
  const mime = (file.type || '').toLowerCase();
  if (ACCEPTED_PDF_TYPES.has(mime)) {
    return true;
  }
  return /\.pdf$/i.test(file.name);
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Area unggah PDF generik: klik, drag-drop, pending vs dokumen existing, validasi PDF.
 * Untuk konteks proposal / engagement letter gunakan wrapper di feature lead-workspace.
 */
export const PdfDocumentField = ({
  pendingFile,
  existingDocumentName = null,
  disabled = false,
  onSelectFile,
  onClearPending,
  existingDocumentDescription = 'Dokumen saat ini',
  clearPendingAriaLabel = 'Hapus file yang dipilih',
  emptyStateExampleHint,
  accept = 'application/pdf,.pdf',
  isAcceptedFile = isAcceptedPdfFile,
  formatHint = 'PDF saja — maks. 20 MB'
}: PdfDocumentFieldProps) => {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const hasPendingFile = Boolean(pendingFile);
  const hasExistingDocument = Boolean(existingDocumentName?.trim());
  const hasDocument = hasPendingFile || hasExistingDocument;

  const openFilePicker = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleSelectFile = (file: File | null) => {
    if (!file) {
      onSelectFile(null);
      return;
    }
    if (!isAcceptedFile(file)) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    onSelectFile(file);
  };

  const clearPendingFile = () => {
    if (disabled) return;
    onClearPending();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        id={fileInputId}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => handleSelectFile(event.target.files?.[0] ?? null)}
      />

      {!hasDocument ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (disabled) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openFilePicker();
            }
          }}
          onDragEnter={(event) => {
            if (disabled) return;
            event.preventDefault();
            event.stopPropagation();
            dragCounter.current += 1;
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            event.stopPropagation();
            dragCounter.current -= 1;
            if (dragCounter.current <= 0) {
              dragCounter.current = 0;
              setIsDragging(false);
            }
          }}
          onDragOver={(event) => {
            if (disabled) return;
            event.preventDefault();
            event.stopPropagation();
          }}
          onDrop={(event) => {
            if (disabled) return;
            event.preventDefault();
            event.stopPropagation();
            dragCounter.current = 0;
            setIsDragging(false);
            handleSelectFile(event.dataTransfer.files?.[0] ?? null);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 ${
            disabled
              ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
              : isDragging
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
          }`}
        >
          <Upload
            className={`h-8 w-8 shrink-0 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`}
            strokeWidth={1.75}
          />
          <p className="text-sm font-medium text-slate-700">Seret & lepas PDF di sini, atau klik untuk memilih</p>
          <p className="text-xs text-slate-500">{formatHint}</p>
          {emptyStateExampleHint ? (
            <p className="text-xs font-medium text-slate-400">{emptyStateExampleHint}</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="rounded-md bg-white p-2 shadow-sm">
                  <FileText className="h-5 w-5 text-[#003c90]" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-semibold text-slate-900"
                    title={pendingFile?.name ?? existingDocumentName ?? ''}
                  >
                    {pendingFile?.name ?? existingDocumentName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {pendingFile
                      ? `${formatFileSize(pendingFile.size)} · Akan diunggah saat menyimpan`
                      : existingDocumentDescription}
                  </p>
                </div>
              </div>
              {!disabled && pendingFile ? (
                <button
                  type="button"
                  onClick={clearPendingFile}
                  className="rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                  aria-label={clearPendingAriaLabel}
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              ) : null}
            </div>
          </div>

          {!disabled ? (
            <button
              type="button"
              onClick={openFilePicker}
              className="text-xs font-semibold text-[#0f52ba] underline decoration-[#0f52ba]/50 underline-offset-2 hover:text-[#003c90]"
            >
              Pilih file lain
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};
