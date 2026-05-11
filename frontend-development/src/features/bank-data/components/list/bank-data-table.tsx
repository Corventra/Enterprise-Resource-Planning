import { Building2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { BankDataEntry, BankDataStatus } from '../../types/bank-data.types';
import { BankDataTableRowActions } from './bank-data-table-row-actions';

interface BankDataTableProps {
  entries: BankDataEntry[];
  allowMutations?: boolean;
  onView: (entry: BankDataEntry) => void;
  onProcess: (entry: BankDataEntry) => void;
  onArchive: (entry: BankDataEntry) => void;
  footer?: ReactNode;
}

const thBase =
  'border-none px-4 py-3 align-middle text-[11px] font-bold uppercase tracking-wider text-[#737784] first:pl-5 last:pr-5';

const statusClass = (status: BankDataStatus) => {
  switch (status) {
    case 'New':
      return 'bg-[#d9e2ff] text-[#00419c]';
    case 'Processed':
      return 'bg-[#4edea3]/25 text-[#004b31]';
    case 'Archived':
      return 'bg-[#e0e3e5] text-[#434653]';
    default:
      return 'bg-[#e0e3e5] text-[#434653]';
  }
};

const formatSubmitted = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatHandledAt = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const BankDataTable = ({
  entries,
  allowMutations = false,
  onView,
  onProcess,
  onArchive,
  footer
}: BankDataTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]/80">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-none bg-[#eceef0]">
              <th className={`${thBase} text-left`}>Submitted At</th>
              <th className={`${thBase} text-left`}>Company Name</th>
              <th className={`${thBase} text-left`}>Contact</th>
              <th className={`${thBase} text-left`}>Source</th>
              <th className={`${thBase} text-left`}>Campaign</th>
              <th className={`${thBase} text-center`}>Status</th>
              <th className={`${thBase} text-left`}>Handled By</th>
              <th className={`${thBase} text-left`}>Handled At</th>
              <th className={`${thBase} text-center`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {entries.map((entry) => (
              <tr key={entry.id} className="group transition-colors hover:bg-[#eceef0]/30">
                <td className="px-4 py-3.5 text-xs text-[#434653]">{formatSubmitted(entry.submittedAt)}</td>
                <td className="py-3.5 pl-5 pr-4">
                  <p className="text-sm font-bold text-[#191c1e] transition-colors group-hover:text-[#003c90]">
                    {entry.companyName}
                  </p>
                </td>
                <td className="px-4 py-3.5 text-xs text-[#434653]">
                  <p className="font-semibold text-[#191c1e]">{entry.contactName}</p>
                  <p className="mt-0.5">{entry.contactEmail}</p>
                </td>
                <td className="px-4 py-3.5 text-xs font-medium text-[#434653]">{entry.source}</td>
                <td className="px-4 py-3.5 text-xs text-[#434653]">
                  <div className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#737784]" />
                    <span>{entry.campaignName}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex justify-center">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${statusClass(entry.status)}`}>
                      {entry.status}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-[#434653]">{entry.handledBy ?? '—'}</td>
                <td className="px-4 py-3.5 text-xs text-[#434653]">{formatHandledAt(entry.handledAt)}</td>
                <td className="py-3.5 pl-4 pr-5 align-middle">
                  <BankDataTableRowActions
                    allowMutations={allowMutations}
                    onView={() => onView(entry)}
                    onProcess={() => onProcess(entry)}
                    onArchive={() => onArchive(entry)}
                    canProcess={entry.status === 'New'}
                    canArchive={entry.status === 'New'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
};
