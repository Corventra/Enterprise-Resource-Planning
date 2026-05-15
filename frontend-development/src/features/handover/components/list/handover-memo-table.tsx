import { Check, Eye, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { handoverStatusStyleMap, type HandoverStatus } from '../../types/handover.types';

export interface HandoverMemoTableRow {
  id: string;
  docCode: string;
  client: string;
  title: string;
  serviceLine?: string;
  status: HandoverStatus;
  actorBy: string;
  actorAt: string | null;
}

export type HandoverMemoActorColumn = 'submitted' | 'created';

const ACTOR_COLUMN_LABELS: Record<HandoverMemoActorColumn, { by: string; at: string }> = {
  submitted: { by: 'Submitted By', at: 'Submitted At' },
  created: { by: 'Created By', at: 'Created At' }
};

interface HandoverMemoTableProps {
  rows: HandoverMemoTableRow[];
  onView: (row: HandoverMemoTableRow) => void;
  footer?: ReactNode;
  actorColumn?: HandoverMemoActorColumn;
  showApprovalActions?: boolean;
  isReadOnly?: boolean;
  onApprove?: (row: HandoverMemoTableRow) => void;
  onRequestRevision?: (row: HandoverMemoTableRow) => void;
}

const thBase =
  'border-none px-4 py-3 align-middle text-[11px] font-bold uppercase tracking-wider text-[#737784] first:pl-5 last:pr-5';

const formatActorAt = (iso: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const HandoverMemoTable = ({
  rows,
  onView,
  footer,
  actorColumn = 'submitted',
  showApprovalActions = false,
  isReadOnly = false,
  onApprove,
  onRequestRevision
}: HandoverMemoTableProps) => {
  const actorLabels = ACTOR_COLUMN_LABELS[actorColumn];

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]/80">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-none bg-[#eceef0]">
              <th className={`${thBase} text-left`}>Doc Code</th>
              <th className={`${thBase} text-left`}>Client &amp; Title</th>
              <th className={`${thBase} text-left`}>Status</th>
              <th className={`${thBase} text-left`}>{actorLabels.by}</th>
              <th className={`${thBase} text-left`}>{actorLabels.at}</th>
              <th className={`${thBase} text-center`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {rows.map((row) => (
              <tr key={row.id} className="group transition-colors hover:bg-[#eceef0]/30">
                <td className="py-3.5 pl-5 pr-4">
                  <p className="font-mono text-xs font-bold text-[#003c90]">{row.docCode}</p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm font-bold text-[#191c1e] transition-colors group-hover:text-[#003c90]">
                    {row.client}
                  </p>
                  <p className="mt-1 text-xs text-[#737784]">{row.title}</p>
                  {row.serviceLine ? (
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[#737784]">
                      {row.serviceLine}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${handoverStatusStyleMap[row.status]}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs font-medium text-[#434653]">{row.actorBy}</td>
                <td className="px-4 py-3.5 text-xs font-medium text-[#434653]">{formatActorAt(row.actorAt)}</td>
                <td className="py-3.5 pl-4 pr-5 align-middle">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => onView(row)}
                      className="inline-flex cursor-pointer text-[#737784] transition-colors hover:text-[#003c90] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d59c1]/40"
                      aria-label="View detail"
                      title="View detail"
                    >
                      <Eye className="h-4 w-4" strokeWidth={2} />
                    </button>
                    {showApprovalActions && !isReadOnly ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onRequestRevision?.(row)}
                          className="inline-flex cursor-pointer text-[#737784] transition-colors hover:text-[#a16207] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a16207]/40"
                          aria-label="Request revision"
                          title="Request revision"
                        >
                          <RotateCcw className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onApprove?.(row)}
                          className="inline-flex cursor-pointer text-[#737784] transition-colors hover:text-[#006544] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006544]/40"
                          aria-label="Approve"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" strokeWidth={2.4} />
                        </button>
                      </>
                    ) : null}
                  </div>
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
