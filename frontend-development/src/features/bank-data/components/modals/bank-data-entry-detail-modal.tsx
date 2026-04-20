import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import type { BankDataEntry } from '../../types/bank-data.types';

interface BankDataEntryDetailModalProps {
  open: boolean;
  entry?: BankDataEntry;
  onClose: () => void;
  onProcess: (entry: BankDataEntry) => Promise<void> | void;
  onArchive: (entry: BankDataEntry) => Promise<void> | void;
}

const statusClassMap: Record<BankDataEntry['status'], string> = {
  New: 'border-[#b0c6ff] bg-[#d9e2ff] text-[#00419c]',
  Processed: 'border-[#4edea3]/40 bg-[#4edea3]/25 text-[#004b31]',
  Archived: 'border-[#c3c6d5] bg-[#e0e3e5] text-[#434653]'
};

const formatSubmittedAt = (iso: string) => {
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
  onClose,
  onProcess,
  onArchive
}: BankDataEntryDetailModalProps) => {
  if (!entry) {
    return null;
  }

  return (
    <SidePanelDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SidePanelDialogHeader
        title="Bank Data Entry Detail"
        description="Read-only detail from campaign form submission."
      />
      <SidePanelDialogBody>
        <div className="space-y-5 text-sm">
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Contact Information</h3>
            </div>
            <div className="grid gap-3 px-4 py-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Company Name</p>
                <p className="mt-1 font-medium text-slate-800">{entry.companyName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Contact Person</p>
                <p className="mt-1 font-medium text-slate-800">{entry.contactName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                <p className="mt-1 font-medium text-slate-800">{entry.contactEmail}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Phone</p>
                <p className="mt-1 font-medium text-slate-800">{entry.contactPhone}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                <span className={`mt-1 inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClassMap[entry.status]}`}>
                  {entry.status}
                </span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Submitted At</p>
                <p className="mt-1 font-medium text-slate-800">{formatSubmittedAt(entry.submittedAt)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Entry Context</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              <li className="grid grid-cols-3 gap-2 px-4 py-3">
                <span className="text-xs uppercase tracking-wide text-slate-500">Source</span>
                <span className="col-span-2 font-medium text-slate-800">{entry.source}</span>
              </li>
              <li className="grid grid-cols-3 gap-2 px-4 py-3">
                <span className="text-xs uppercase tracking-wide text-slate-500">Entry Slug</span>
                <span className="col-span-2 font-medium text-slate-800">{entry.entrySlug}</span>
              </li>
              <li className="grid grid-cols-3 gap-2 px-4 py-3">
                <span className="text-xs uppercase tracking-wide text-slate-500">Campaign</span>
                <span className="col-span-2 font-medium text-slate-800">{entry.campaignName}</span>
              </li>
              <li className="grid grid-cols-3 gap-2 px-4 py-3">
                <span className="text-xs uppercase tracking-wide text-slate-500">Form</span>
                <span className="col-span-2 font-medium text-slate-800">{entry.formName}</span>
              </li>
              <li className="grid grid-cols-3 gap-2 px-4 py-3">
                <span className="text-xs uppercase tracking-wide text-slate-500">Entry ID</span>
                <span className="col-span-2 font-medium text-slate-800">{entry.id}</span>
              </li>
            </ul>
          </section>

        </div>
      </SidePanelDialogBody>
      <SidePanelDialogFooter>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#c3c6d5] px-4 py-2 text-sm font-semibold text-[#434653] hover:bg-[#eceef0]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={async () => onProcess(entry)}
            disabled={entry.status !== 'New'}
            className="rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-35"
          >
            Process
          </button>
          <button
            type="button"
            onClick={async () => onArchive(entry)}
            disabled={entry.status === 'Archived'}
            className="rounded-lg bg-[linear-gradient(135deg,#991b1b_0%,#dc2626_100%)] px-4 py-2 text-sm font-bold text-white shadow-md shadow-red-600/25 transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-35"
          >
            Archive
          </button>
        </div>
      </SidePanelDialogFooter>
    </SidePanelDialog>
  );
};
