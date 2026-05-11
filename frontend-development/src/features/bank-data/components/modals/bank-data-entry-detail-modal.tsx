import { useEffect, useState } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import { resolveFormMediaUrl } from '../../../forms/utils/resolve-form-media-url';
import { bankDataService } from '../../services/bank-data-service';
import type { BankDataEntry } from '../../types/bank-data.types';

interface BankDataEntryDetailModalProps {
  open: boolean;
  entry?: BankDataEntry;
  allowMutations?: boolean;
  onClose: () => void;
  onProcess: (entry: BankDataEntry) => void;
  onArchive: (entry: BankDataEntry) => void;
}

const statusClassMap: Record<BankDataEntry['status'], string> = {
  New: 'border-[#b0c6ff] bg-[#d9e2ff] text-[#00419c]',
  Processed: 'border-[#4edea3]/40 bg-[#4edea3]/25 text-[#004b31]',
  Archived: 'border-[#c3c6d5] bg-[#e0e3e5] text-[#434653]'
};

const formatDateTime = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const BankDataEntryDetailModal = ({
  open,
  entry,
  allowMutations = false,
  onClose,
  onProcess,
  onArchive
}: BankDataEntryDetailModalProps) => {
  const [detail, setDetail] = useState<BankDataEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !entry) {
      setDetail(null);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    void bankDataService
      .getById(entry.id)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setDetail(null);
          setLoadError(e instanceof Error ? e.message : 'Gagal memuat detail lead.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, entry]);

  if (!entry) {
    return null;
  }

  const view = detail ?? entry;

  return (
    <SidePanelDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SidePanelDialogHeader
        title="Detail Bank Data"
        description="Informasi lead dari formulir lead capture."
      />
      <SidePanelDialogBody>
        {isLoading ? (
          <p className="text-sm text-slate-600">Memuat detail…</p>
        ) : loadError ? (
          <p className="text-sm text-red-700">{loadError}</p>
        ) : (
          <div className="space-y-5 text-sm">
            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Ringkasan</h3>
              </div>
              <div className="grid gap-3 px-4 py-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Submitted At</p>
                  <p className="mt-1 font-medium text-slate-800">{formatDateTime(view.submittedAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Campaign</p>
                  <p className="mt-1 font-medium text-slate-800">{view.campaignName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Source</p>
                  <p className="mt-1 font-medium text-slate-800">{view.source}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Form</p>
                  <p className="mt-1 font-medium text-slate-800">{view.formName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                  <span className={`mt-1 inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClassMap[view.status]}`}>
                    {view.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Handled By</p>
                  <p className="mt-1 font-medium text-slate-800">{view.handledBy ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Handled At</p>
                  <p className="mt-1 font-medium text-slate-800">{formatDateTime(view.handledAt)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Kontak & Perusahaan</h3>
              </div>
              <div className="grid gap-3 px-4 py-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Company Name</p>
                  <p className="mt-1 font-medium text-slate-800">{view.companyName}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Company Address</p>
                  <p className="mt-1 whitespace-pre-wrap font-medium text-slate-800">{view.companyAddress ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">PIC Name</p>
                  <p className="mt-1 font-medium text-slate-800">{view.contactName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                  <p className="mt-1 font-medium text-slate-800">{view.contactEmail}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Phone Number</p>
                  <p className="mt-1 font-medium text-slate-800">{view.contactPhone}</p>
                </div>
              </div>
            </section>

            {view.extraAnswers && view.extraAnswers.length > 0 ? (
              <section className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Jawaban Tambahan</h3>
                </div>
                <ul className="divide-y divide-slate-100">
                  {view.extraAnswers.map((answer) => {
                    const fileUrl = resolveFormMediaUrl(answer.filePath);
                    const hasFile = Boolean(fileUrl);
                    const displayValue = answer.displayValue?.trim();
                    return (
                      <li key={answer.fieldId} className="px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{answer.label}</p>
                        {hasFile ? (
                          <a
                            href={fileUrl ?? undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex font-medium text-[#003c90] underline"
                          >
                            Buka file unggahan
                          </a>
                        ) : displayValue ? (
                          <p className="mt-1 whitespace-pre-wrap font-medium text-slate-800">{displayValue}</p>
                        ) : (
                          <p className="mt-1 text-slate-500">—</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </SidePanelDialogBody>
      <SidePanelDialogFooter>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#c3c6d5] px-4 py-2 text-sm font-semibold text-[#434653] hover:bg-[#eceef0]"
          >
            Tutup
          </button>
          {allowMutations && view.status === 'New' ? (
            <>
              <button
                type="button"
                onClick={() => onProcess(view)}
                className="rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90"
              >
                Process
              </button>
              <button
                type="button"
                onClick={() => onArchive(view)}
                className="rounded-lg bg-[linear-gradient(135deg,#991b1b_0%,#dc2626_100%)] px-4 py-2 text-sm font-bold text-white shadow-md shadow-red-600/25 transition-opacity hover:opacity-90"
              >
                Archive
              </button>
            </>
          ) : null}
        </div>
      </SidePanelDialogFooter>
    </SidePanelDialog>
  );
};
