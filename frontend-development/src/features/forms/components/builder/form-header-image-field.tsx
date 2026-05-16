import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { resolveFormMediaUrl } from '../../utils/resolve-form-media-url';

interface FormHeaderImageFieldProps {
  headerImagePath: string;
  pendingFile: File | null;
  disabled?: boolean;
  onSelectFile: (file: File | null) => void;
  onClear: () => void;
}

const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const isAcceptedImageFile = (file: File) => {
  const mime = (file.type || '').toLowerCase();
  if (ACCEPTED_IMAGE_TYPES.has(mime)) return true;
  return /\.(jpe?g|png|webp)$/i.test(file.name);
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FormHeaderImageField = ({
  headerImagePath,
  pendingFile,
  disabled = false,
  onSelectFile,
  onClear
}: FormHeaderImageFieldProps) => {
  const imageInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const savedPreviewUrl = resolveFormMediaUrl(headerImagePath);
  const previewUrl = pendingFile ? pendingPreviewUrl : savedPreviewUrl;
  const hasImage = Boolean(pendingFile || headerImagePath.trim());

  const openFilePicker = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    if (disabled) return;
    onClear();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (!pendingFile) {
      setPendingPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPendingPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
        <ImageIcon className="h-4 w-4 text-gray-600" />
        Gambar header
      </div>
      <p className="mb-3 text-xs text-gray-500">
        Ditampilkan di atas judul form publik. JPEG, PNG, atau WebP — maks. 2 MB.
      </p>

      <input
        ref={fileInputRef}
        id={imageInputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          if (file && !isAcceptedImageFile(file)) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
          onSelectFile(file);
        }}
      />

      {!hasImage ? (
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
            const file = event.dataTransfer.files?.[0] ?? null;
            if (file && isAcceptedImageFile(file)) {
              onSelectFile(file);
            }
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
          <p className="text-sm font-medium text-slate-700">Seret & lepas gambar di sini, atau klik untuk memilih</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative aspect-[772/194.5] w-full overflow-hidden rounded-lg border border-slate-200 bg-[#f0f4f8]">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
              </div>
            )}
          </div>

          {pendingFile ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900" title={pendingFile.name}>
                    {pendingFile.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatFileSize(pendingFile.size)} · Akan diunggah saat menyimpan
                  </p>
                </div>
                {!disabled ? (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                    aria-label="Hapus gambar"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <p className="truncate" title={headerImagePath}>
                {headerImagePath}
              </p>
              {!disabled ? (
                <button
                  type="button"
                  onClick={clearImage}
                  className="font-semibold text-[#0f52ba] underline decoration-[#0f52ba]/50 underline-offset-2 hover:text-[#003c90]"
                >
                  Hapus gambar
                </button>
              ) : null}
            </div>
          )}

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
    </article>
  );
};
