import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type {
  CampaignFormErrors,
  CampaignFormValues,
  CampaignLookupTopic,
  CampaignLookupType
} from '../../types/campaign.types';

interface CampaignFormProps {
  value: CampaignFormValues;
  onChange: <K extends keyof CampaignFormValues>(key: K, value: CampaignFormValues[K]) => void;
  errors: CampaignFormErrors;
  noEndDate: boolean;
  onNoEndDateChange: (value: boolean) => void;
  typeOptions: CampaignLookupType[];
  topicOptions: CampaignLookupTopic[];
  imageFile: File | null;
  onImageChange: (file: File | null) => void;
  mode: 'create' | 'edit';
}

const inputClassName =
  'h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none';
const labelClassName = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

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

export const CampaignForm = ({
  value,
  onChange,
  errors,
  noEndDate,
  onNoEndDateChange,
  typeOptions,
  topicOptions,
  imageFile,
  onImageChange,
  mode
}: CampaignFormProps) => {
  const imageInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const openFilePicker = () => fileInputRef.current?.click();

  const clearImage = () => {
    onImageChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClassName}>Campaign Name</label>
        <input
          value={value.name}
          onChange={(event) => onChange('name', event.target.value)}
          placeholder="e.g. Q3 SME Lead Push"
          className={inputClassName}
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className={labelClassName}>Campaign Type</label>
          <select
            value={value.campaignTypeId === '' ? '' : String(value.campaignTypeId)}
            onChange={(event) => {
              const raw = event.target.value;
              onChange('campaignTypeId', raw === '' ? '' : Number(raw));
            }}
            className={inputClassName}
          >
            <option value="">Select type</option>
            {typeOptions.map((t) => (
              <option key={t.campaign_type_id} value={t.campaign_type_id}>
                {t.name}
              </option>
            ))}
          </select>
          {errors.campaignTypeId && <p className="mt-1 text-xs text-red-600">{errors.campaignTypeId}</p>}
        </div>

        <div>
          <label className={labelClassName}>Topic</label>
          <select
            value={value.topicId === '' ? '' : String(value.topicId)}
            onChange={(event) => {
              const raw = event.target.value;
              onChange('topicId', raw === '' ? '' : Number(raw));
            }}
            className={inputClassName}
          >
            <option value="">Select topic</option>
            {topicOptions.map((t) => (
              <option key={t.topic_id} value={t.topic_id}>
                {t.name}
              </option>
            ))}
          </select>
          {errors.topicId && <p className="mt-1 text-xs text-red-600">{errors.topicId}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className={labelClassName}>Start Date</label>
          <input
            type="date"
            value={value.startDate}
            onChange={(event) => onChange('startDate', event.target.value)}
            className={inputClassName}
          />
          {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
        </div>
        <div>
          <label className={labelClassName}>End Date</label>
          <input
            type="date"
            value={value.endDate}
            disabled={noEndDate}
            onChange={(event) => onChange('endDate', event.target.value)}
            className={`${inputClassName} disabled:bg-slate-100 disabled:text-slate-400`}
          />
          {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>}
        </div>
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={noEndDate}
          onChange={(event) => onNoEndDateChange(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        Ongoing campaign (no end date)
      </label>

      <div>
        <label className={labelClassName}>Notes (Optional)</label>
        <textarea
          value={value.notes}
          onChange={(event) => onChange('notes', event.target.value)}
          rows={5}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
          placeholder={
            mode === 'create'
              ? 'Add operational notes for this campaign...'
              : 'Update operational notes for this campaign...'
          }
        />
        {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes}</p>}
      </div>

      <div>
        <p className={labelClassName}>Campaign image (optional)</p>
        <input
          ref={fileInputRef}
          id={imageInputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            if (file && !isAcceptedImageFile(file)) {
              if (fileInputRef.current) fileInputRef.current.value = '';
              return;
            }
            onImageChange(file);
          }}
        />

        {!imageFile ? (
          <div
            role="button"
            tabIndex={0}
            onClick={openFilePicker}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openFilePicker();
              }
            }}
            onDragEnter={(event) => {
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
              event.preventDefault();
              event.stopPropagation();
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              dragCounter.current = 0;
              setIsDragging(false);
              const file = event.dataTransfer.files?.[0] ?? null;
              if (file && isAcceptedImageFile(file)) {
                onImageChange(file);
              }
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 ${
              isDragging
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Upload
              className={`h-8 w-8 shrink-0 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`}
              strokeWidth={1.75}
            />
            <p className="text-sm font-medium text-slate-700">
              Seret & lepas gambar di sini, atau klik untuk memilih
            </p>
            <p className="text-xs text-slate-500">JPEG, PNG, WebP — maks. 2 MB (sesuai backend)</p>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-[#eceef0] p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-white bg-white shadow-sm">
                {imagePreviewUrl ? (
                  <img src={imagePreviewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-emerald-50">
                    <ImageIcon className="h-7 w-7 text-emerald-600" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-bold text-[#191c1e]" title={imageFile.name}>
                    {imageFile.name}
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums text-[#434653]">100%</span>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="rounded p-0.5 text-[#737784] transition-colors hover:bg-slate-200 hover:text-[#191c1e]"
                      aria-label="Hapus gambar"
                    >
                      <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-[#737784]">
                  {formatFileSize(imageFile.size)} · Ready to upload
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-300/80">
                  <div className="h-full w-full rounded-full bg-[linear-gradient(90deg,#003c90_0%,#0f52ba_100%)]" />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={openFilePicker}
              className="mt-3 text-xs font-semibold text-[#0f52ba] underline decoration-[#0f52ba]/50 underline-offset-2 hover:text-[#003c90]"
            >
              Choose different file
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
