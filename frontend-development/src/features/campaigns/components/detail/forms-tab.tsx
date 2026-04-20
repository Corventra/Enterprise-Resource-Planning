import { Copy, ExternalLink, Pause, Pencil, Play, Plus, Square, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Form } from '../../types/campaign.types';

interface FormsTabProps {
  campaignId: string;
  campaignName: string;
  forms: Form[];
  onDeleteForm: (form: Form) => void;
  onToggleStatus: (form: Form) => void;
  onCreateForm: () => void;
}

const formatIdDateTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const qrImageSrc = (data: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data)}`;

const defaultShortLinks = (form: Form): { label: string; url: string }[] => {
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  return [{ label: 'Public', url: `${base}/forms/${form.id}` }];
};

const FormCard = ({
  form,
  campaignId,
  campaignName,
  onDeleteForm,
  onToggleStatus
}: {
  form: Form;
  campaignId: string;
  campaignName: string;
  onDeleteForm: (form: Form) => void;
  onToggleStatus: (form: Form) => void;
}) => {
  const navigate = useNavigate();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const links = form.shortLinks?.length ? form.shortLinks : defaultShortLinks(form);
  const fieldCount = form.fieldCount ?? '—';
  const createdBy = form.createdBy ?? '—';
  const createdAt = formatIdDateTime(form.createdAt);
  const updatedAt = formatIdDateTime(form.updatedAt);
  const publishedAt = formatIdDateTime(form.publishedAt);

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // ignore
    }
  };

  const goEdit = () => {
    navigate(
      `/forms/${form.id}?campaignId=${encodeURIComponent(campaignId)}&campaignName=${encodeURIComponent(campaignName)}`
    );
  };

  return (
    <article className="mb-6 last:mb-0 rounded-xl border border-[#eceef0] bg-white p-5 shadow-sm ring-1 ring-[#eceef0]/80 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eceef0] pb-4">
        <h4 className="text-base font-bold text-[#191c1e] sm:text-lg">
          <span className="text-[#003c90]">{form.name}</span>
        </h4>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${
            form.status === 'Active'
              ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80'
              : 'bg-[#e0e3e5] text-[#434653]'
          }`}
        >
          {form.status === 'Active' ? 'Published' : 'Archived'}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[#737784] sm:text-sm">
        <span className="font-semibold text-[#434653]">{fieldCount}</span> fields
        <span className="mx-1.5 text-[#c3c6d5]">•</span>
        <span className="font-medium text-[#434653]">Created by</span> {createdBy}
        <span className="mx-1.5 text-[#c3c6d5]">•</span>
        <span className="font-medium text-[#434653]">Created</span> {createdAt}
        <span className="mx-1.5 text-[#c3c6d5]">•</span>
        <span className="font-medium text-[#434653]">Updated</span> {updatedAt}
        <span className="mx-1.5 text-[#c3c6d5]">•</span>
        <span className="font-medium text-[#434653]">Published</span> {publishedAt}
        <span className="mx-1.5 text-[#c3c6d5]">•</span>
        <span className="font-medium text-[#434653]">Submissions</span>{' '}
        <span className="font-semibold text-[#191c1e]">{form.submissionCount}</span>
      </p>

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#434653] sm:text-xs">
            Shortlink <span className="font-normal text-[#737784]">(custom path · auto from title)</span>
          </p>
          <button
            type="button"
            onClick={goEdit}
            className="text-xs font-semibold text-[#003c90] transition-colors hover:text-[#0f52ba]"
          >
            Custom
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {links.map((link) => {
            const copyKey = `${form.id}-${link.label}`;
            return (
              <div
                key={copyKey}
                className="rounded-xl border border-[#eceef0] bg-[#f7f9fb]/60 p-4 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">{link.label}</p>
                <div className="mt-2 flex gap-2">
                  <input
                    readOnly
                    value={link.url}
                    className="min-w-0 flex-1 truncate rounded-lg border border-[#eceef0] bg-white px-3 py-2 text-xs text-[#191c1e] shadow-sm"
                  />
                  <button
                    type="button"
                    title="Copy link"
                    onClick={() => void copyText(link.url, copyKey)}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[#eceef0] bg-white p-2 text-[#737784] transition-colors hover:border-[#003c90]/30 hover:text-[#003c90]"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Open"
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[#eceef0] bg-white p-2 text-[#737784] transition-colors hover:border-[#003c90]/30 hover:text-[#003c90]"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                {copiedKey === copyKey && (
                  <p className="mt-1 text-[10px] font-medium text-emerald-700">Copied to clipboard</p>
                )}

                <div className="mt-4 flex flex-col items-center">
                  <div className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-[#eceef0]">
                    <img
                      src={qrImageSrc(link.url)}
                      alt=""
                      width={148}
                      height={148}
                      className="h-[148px] w-[148px] object-contain"
                    />
                  </div>
                  <p className="mt-2 max-w-full truncate px-1 text-center text-[10px] text-[#737784]">{link.url}</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => void copyText(link.url, `${copyKey}-link`)}
                      className="rounded-lg border border-[#c3c6d5] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#434653] hover:bg-[#eceef0] sm:text-xs"
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyText(qrImageSrc(link.url), `${copyKey}-qr`)}
                      className="rounded-lg border border-[#c3c6d5] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#434653] hover:bg-[#eceef0] sm:text-xs"
                    >
                      Copy QR URL
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-1 border-t border-[#eceef0] pt-4">
        <button
          type="button"
          onClick={() => onToggleStatus(form)}
          title={form.status === 'Active' ? 'Pause (archive form)' : 'Resume form'}
          aria-label={form.status === 'Active' ? 'Pause form' : 'Resume form'}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#737784] transition-colors hover:bg-[#eceef0] hover:text-[#003c90] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d59c1]/30"
        >
          {form.status === 'Active' ? (
            <Pause className="h-4 w-4" strokeWidth={2.25} />
          ) : (
            <Play className="h-4 w-4" strokeWidth={2.25} />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            if (form.status === 'Active') {
              onToggleStatus(form);
            }
          }}
          disabled={form.status !== 'Active'}
          title="End publishing (archive)"
          aria-label="End publishing"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#737784] transition-colors hover:bg-[#eceef0] hover:text-[#003c90] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d59c1]/30 disabled:pointer-events-none disabled:opacity-35"
        >
          <Square className="h-4 w-4" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={goEdit}
          title="Edit form"
          aria-label="Edit form"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#737784] transition-colors hover:bg-[#eceef0] hover:text-[#003c90] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d59c1]/30"
        >
          <Pencil className="h-4 w-4" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={() => onDeleteForm(form)}
          title="Delete form"
          aria-label="Delete form"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#737784] transition-colors hover:bg-red-50 hover:text-[#dc2626] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>
    </article>
  );
};

export const FormsTab = ({
  campaignId,
  campaignName,
  forms,
  onDeleteForm,
  onToggleStatus,
  onCreateForm
}: FormsTabProps) => {
  return (
    <section className="pt-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-[#191c1e] sm:text-lg">Campaign Forms</h3>
        <button
          type="button"
          onClick={onCreateForm}
          className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 sm:px-5 sm:text-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Create Form
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#c3c6d5] bg-[#f7f9fb]/50 py-10 text-center text-sm text-[#737784]">
          No forms registered in this campaign.
        </div>
      ) : (
        <div>
          {forms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              campaignId={campaignId}
              campaignName={campaignName}
              onDeleteForm={onDeleteForm}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </div>
      )}
    </section>
  );
};
