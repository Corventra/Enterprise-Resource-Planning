import { useEffect, useRef, useState } from 'react';
import {
  Archive,
  ExternalLink,
  Link2,
  List,
  Pencil,
  Pause,
  Play,
  Plus,
  QrCode,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Form } from '../../types/campaign.types';
import { DeactivateFormConfirmDialog } from '../modals/deactivate-form-confirm-dialog';
import { DeleteFormConfirmDialog } from '../modals/delete-form-confirm-dialog';
import { getFormChannelLabel } from '../../../forms/constants/form-channels';
import {
  deactivateForm,
  deleteDraftForm,
  getFormLinks,
  pauseFormResponses,
  publishForm,
  resumeFormResponses
} from '../../../forms/services/forms-api';
import type { FormBackendStatus, FormDistributionLink } from '../../../forms/types/form-builder.types';
import { buildPublicQrDownloadFilename, downloadPublicQrImage } from '../../../forms/utils/form-qr';
import { getFormDisplayBadge } from '../../../forms/utils/form-display-status';

interface FormsTabProps {
  campaignId: string;
  forms: Form[];
  canManageCampaignForms: boolean;
  highlightFormId: string | null;
  onHighlightConsumed: () => void;
  onRefetchForms: () => void;
  onCreateForm: () => void;
  onViewSubmissions: (formId: string) => void;
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

function resolveBackendStatus(form: Form): FormBackendStatus {
  if (form.backendFormStatus) return form.backendFormStatus;
  if (form.status === 'Active') return 'PUBLISHED';
  if (form.status === 'Inactive') return 'INACTIVE';
  if (form.status === 'Archived') return 'INACTIVE';
  return 'DRAFT';
}

function LinkActionRow({
  row,
  downloadName,
  onCopy,
  onDownloadQr
}: {
  row: FormDistributionLink;
  downloadName: string;
  onCopy: (label: string, text: string) => void;
  onDownloadQr: (publicUrl: string, filename: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => void onCopy('URL publik', row.publicUrl)}
        className="inline-flex items-center gap-1 rounded border border-[#eceef0] bg-white px-2 py-1 text-[11px] font-semibold text-[#434653] hover:bg-[#f7f9fb] sm:text-xs"
      >
        <Link2 className="h-3.5 w-3.5" />
        Copy link
      </button>
      <button
        type="button"
        onClick={() => onDownloadQr(row.publicUrl, buildPublicQrDownloadFilename(downloadName))}
        className="inline-flex items-center gap-1 rounded border border-[#eceef0] bg-white px-2 py-1 text-[11px] font-semibold text-[#434653] hover:bg-[#f7f9fb] sm:text-xs"
      >
        <QrCode className="h-3.5 w-3.5" />
        QR
      </button>
    </div>
  );
}

const FormCard = ({
  form,
  campaignId,
  canManageCampaignForms,
  highlightFormId,
  onHighlightConsumed,
  onRefetchForms,
  onViewSubmissions
}: {
  form: Form;
  campaignId: string;
  canManageCampaignForms: boolean;
  highlightFormId: string | null;
  onHighlightConsumed: () => void;
  onRefetchForms: () => void;
  onViewSubmissions: (formId: string) => void;
}) => {
  const navigate = useNavigate();
  const articleRef = useRef<HTMLElement>(null);
  const [links, setLinks] = useState<FormDistributionLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateBusy, setDeactivateBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const backendStatus = resolveBackendStatus(form);
  const badge = getFormDisplayBadge(backendStatus, form.isAcceptingResponses);
  const formCategory = form.formCategory ?? 'GENERAL';
  useEffect(() => {
    let cancelled = false;
    setLinksLoading(true);
    void getFormLinks(form.id)
      .then((data) => {
        if (!cancelled) setLinks(data);
      })
      .catch(() => {
        if (!cancelled) setLinks([]);
      })
      .finally(() => {
        if (!cancelled) setLinksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.id]);

  useEffect(() => {
    if (highlightFormId !== form.id || !articleRef.current) return;
    articleRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    onHighlightConsumed();
  }, [highlightFormId, form.id, onHighlightConsumed]);

  useEffect(() => {
    if (!copyToast) return;
    const t = window.setTimeout(() => setCopyToast(null), 3000);
    return () => window.clearTimeout(t);
  }, [copyToast]);

  const primary = links.find((l) => l.linkType === 'PRIMARY');
  const channelLinks =
    formCategory === 'LEAD_CAPTURE' ? links.filter((l) => l.linkType === 'CHANNEL') : [];

  const badgeClass =
    badge.tone === 'inactive'
      ? 'bg-[#e0e3e5] text-[#434653]'
      : badge.tone === 'draft'
        ? 'bg-sky-100 text-sky-900 ring-1 ring-sky-200/80'
        : badge.tone === 'paused'
          ? 'bg-amber-100 text-amber-950 ring-1 ring-amber-200'
          : 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80';

  const runAction = async (fn: () => Promise<unknown>) => {
    setActionErr(null);
    setBusy(true);
    try {
      await fn();
      const fresh = await getFormLinks(form.id);
      setLinks(fresh);
      onRefetchForms();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Aksi gagal');
    } finally {
      setBusy(false);
    }
  };

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast(`${label} disalin.`);
    } catch {
      setCopyToast('Gagal menyalin ke clipboard.');
    }
  };

  const qrDownloadName = form.formCode?.trim() || form.id;

  const handleDownloadQr = async (publicUrl: string, filename: string) => {
    try {
      await downloadPublicQrImage(publicUrl, filename);
      setCopyToast('QR code terunduh.');
    } catch (e) {
      setCopyToast(e instanceof Error ? e.message : 'Gagal mengunduh QR code.');
    }
  };

  const showPublishDraft = canManageCampaignForms && backendStatus === 'DRAFT';
  const showDeleteDraft = canManageCampaignForms && backendStatus === 'DRAFT';
  const showPause =
    canManageCampaignForms && backendStatus === 'PUBLISHED' && form.isAcceptingResponses !== false;
  const showResume =
    canManageCampaignForms && backendStatus === 'PUBLISHED' && form.isAcceptingResponses === false;
  const showDeactivate = canManageCampaignForms && backendStatus === 'PUBLISHED';

  const handleDeactivateConfirm = async (formId: string) => {
    setDeactivateBusy(true);
    setActionErr(null);
    try {
      await deactivateForm(formId);
      const fresh = await getFormLinks(formId);
      setLinks(fresh);
      onRefetchForms();
      setDeactivateOpen(false);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Gagal menonaktifkan form');
    } finally {
      setDeactivateBusy(false);
    }
  };

  return (
    <article
      ref={articleRef}
      className={`mb-6 last:mb-0 rounded-xl border border-[#eceef0] bg-white p-5 shadow-sm ring-1 ring-[#eceef0]/80 sm:p-6 ${
        highlightFormId === form.id ? 'ring-2 ring-[#003c90]/40' : ''
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eceef0] pb-4">
        <div>
          <h4 className="text-base font-bold text-[#191c1e] sm:text-lg">
            <span className="text-[#003c90]">{form.name}</span>
          </h4>
          {form.formCode ? (
            <p className="mt-1 font-mono text-xs text-[#737784]">{form.formCode}</p>
          ) : null}
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[#737784]">
            {formCategory === 'LEAD_CAPTURE' ? 'Lead capture' : 'General'}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${badgeClass}`}
        >
          {badge.label}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[#737784] sm:text-sm">
        <span className="font-medium text-[#434653]">Updated</span> {formatIdDateTime(form.updatedAt)}
        <span className="mx-1.5 text-[#c3c6d5]">•</span>
        <span className="font-medium text-[#434653]">Created</span> {formatIdDateTime(form.createdAt)}
      </p>

      <div className="mt-3 rounded-lg border border-[#eceef0] bg-[#f7f9fb]/60 px-3 py-3 text-xs text-[#434653]">
        {linksLoading ? (
          <span className="text-[#737784]">Memuat link…</span>
        ) : backendStatus === 'DRAFT' ? (
          <span className="text-[#737784]">Link distribusi dibuat otomatis saat publish.</span>
        ) : !primary ? (
          <span className="text-[#737784]">Tidak ada link utama.</span>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-[#191c1e]">Link utama (PRIMARY)</p>
              <p className="mt-1 break-all font-mono text-[11px] text-[#003c90]">{primary.publicUrl}</p>
              <p className="mt-0.5 font-mono text-[11px] text-[#737784]">Kode: {primary.linkCode}</p>
              <LinkActionRow
                row={primary}
                downloadName={qrDownloadName}
                onCopy={copyText}
                onDownloadQr={(url, filename) => void handleDownloadQr(url, filename)}
              />
            </div>

            {formCategory === 'LEAD_CAPTURE' && channelLinks.length > 0 ? (
              <div className="border-t border-[#eceef0] pt-3">
                <p className="font-semibold text-[#191c1e]">Channel</p>
                <ul className="mt-2 space-y-3">
                  {channelLinks.map((row) => {
                    const label =
                      getFormChannelLabel(row.channelCode ?? undefined) ??
                      row.channelName ??
                      row.channelCode ??
                      'Channel';
                    return (
                      <li key={row.distributionLinkId} className="rounded-lg border border-[#eceef0] bg-white p-2.5">
                        <p className="text-[11px] font-bold uppercase text-[#434653]">{label}</p>
                        <p className="mt-0.5 break-all font-mono text-[11px] text-[#003c90]">{row.publicUrl}</p>
                        <p className="font-mono text-[10px] text-[#737784]">Kode: {row.linkCode}</p>
                        <LinkActionRow
                          row={row}
                          downloadName={qrDownloadName}
                          onCopy={copyText}
                          onDownloadQr={(url, filename) => void handleDownloadQr(url, filename)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : formCategory === 'LEAD_CAPTURE' ? (
              <p className="border-t border-[#eceef0] pt-2 text-[#737784]">Belum ada link channel.</p>
            ) : null}
          </div>
        )}
      </div>

      {copyToast ? (
        <p className="mt-2 text-xs font-medium text-emerald-700">{copyToast}</p>
      ) : null}
      {actionErr ? <p className="mt-2 text-xs text-red-600">{actionErr}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate(`/campaigns/${campaignId}/forms/${form.id}/preview`)}
          className="inline-flex items-center gap-2 rounded-lg border border-[#c3c6d5] bg-white px-3 py-2 text-xs font-semibold text-[#434653] hover:bg-[#f7f9fb] sm:text-sm"
        >
          <ExternalLink className="h-4 w-4" />
          Preview
        </button>
        <button
          type="button"
          onClick={() => navigate(`/campaigns/${campaignId}/forms/${form.id}`)}
          className="inline-flex items-center gap-2 rounded-lg border border-[#c3c6d5] bg-white px-3 py-2 text-xs font-semibold text-[#434653] hover:bg-[#f7f9fb] sm:text-sm"
        >
          <Pencil className="h-4 w-4" />
          {canManageCampaignForms ? 'Buka builder' : 'Lihat builder'}
        </button>
        <button
          type="button"
          onClick={() => onViewSubmissions(form.id)}
          className="inline-flex items-center gap-2 rounded-lg border border-[#c3c6d5] bg-white px-3 py-2 text-xs font-semibold text-[#434653] hover:bg-[#f7f9fb] sm:text-sm"
        >
          <List className="h-4 w-4" />
          Lihat Submissions
        </button>

        {showPublishDraft ? (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void runAction(async () => {
                await publishForm(form.id);
              })
            }
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 sm:text-sm"
          >
            Publish
          </button>
        ) : null}

        {showDeleteDraft ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50 sm:text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Hapus draft
          </button>
        ) : null}

        {showPause ? (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void runAction(async () => {
                await pauseFormResponses(form.id);
              })
            }
            className="inline-flex items-center gap-2 rounded-lg border border-[#c3c6d5] bg-white px-3 py-2 text-xs font-semibold text-[#434653] hover:bg-[#f7f9fb] disabled:opacity-50 sm:text-sm"
          >
            <Pause className="h-4 w-4" />
            Jeda
          </button>
        ) : null}

        {showResume ? (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void runAction(async () => {
                await resumeFormResponses(form.id);
              })
            }
            className="inline-flex items-center gap-2 rounded-lg border border-[#c3c6d5] bg-white px-3 py-2 text-xs font-semibold text-[#434653] hover:bg-[#f7f9fb] disabled:opacity-50 sm:text-sm"
          >
            <Play className="h-4 w-4" />
            Lanjutkan
          </button>
        ) : null}

        {showDeactivate ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setDeactivateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-50 sm:text-sm"
          >
            <Archive className="h-4 w-4" />
            Nonaktifkan
          </button>
        ) : null}
      </div>

      <DeactivateFormConfirmDialog
        open={deactivateOpen}
        form={form}
        busy={deactivateBusy}
        onClose={() => !deactivateBusy && setDeactivateOpen(false)}
        onConfirm={handleDeactivateConfirm}
      />

      <DeleteFormConfirmDialog
        open={deleteOpen}
        form={form}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async (formId) => {
          setBusy(true);
          setActionErr(null);
          try {
            await deleteDraftForm(formId);
            onRefetchForms();
          } catch (e) {
            setActionErr(e instanceof Error ? e.message : 'Gagal menghapus form');
            throw e;
          } finally {
            setBusy(false);
          }
        }}
      />

    </article>
  );
};

export const FormsTab = ({
  campaignId,
  forms,
  canManageCampaignForms,
  highlightFormId,
  onHighlightConsumed,
  onRefetchForms,
  onCreateForm,
  onViewSubmissions
}: FormsTabProps) => {
  return (
    <section className="pt-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-[#191c1e] sm:text-lg">Campaign Forms</h3>
        {canManageCampaignForms ? (
          <button
            type="button"
            onClick={onCreateForm}
            className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 sm:px-5 sm:text-sm"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Create Form
          </button>
        ) : null}
      </div>

      {forms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#c3c6d5] bg-[#f7f9fb]/50 py-10 text-center text-sm text-[#737784]">
          Belum ada form untuk campaign ini.
        </div>
      ) : (
        <div>
          {forms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              campaignId={campaignId}
              canManageCampaignForms={canManageCampaignForms}
              highlightFormId={highlightFormId}
              onHighlightConsumed={onHighlightConsumed}
              onRefetchForms={onRefetchForms}
              onViewSubmissions={onViewSubmissions}
            />
          ))}
        </div>
      )}
    </section>
  );
};
