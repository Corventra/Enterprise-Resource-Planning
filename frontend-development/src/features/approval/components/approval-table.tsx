import { Check, Eye, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { handoverStatusStyleMap, mapHandoverDbStatusToLabel } from '../../handover/types/handover.types';
import { APPROVAL_KIND_LABELS, type ApprovalItem } from '../types/approval.types';

interface ApprovalTableProps {
  items: ApprovalItem[];
  onView: (item: ApprovalItem) => void;
  onApprove: (item: ApprovalItem) => void;
  onRequestRevision: (item: ApprovalItem) => void;
  isReadOnly?: boolean;
  /** Handover tab: show workflow status instead of approval kind (Type). */
  handoverStatusColumn?: boolean;
  footer?: ReactNode;
}

const thBase =
  'border-none px-4 py-3 align-middle text-[11px] font-bold uppercase tracking-wider text-[#737784] first:pl-5 last:pr-5';

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const kindBadgeClass: Record<ApprovalItem['kind'], string> = {
  Proposal: 'bg-[#d5e3fc] text-[#003c90]',
  EngagementLetter: 'bg-amber-100 text-[#a16207]',
  HandoverMemo: 'bg-[#4edea3]/25 text-[#004b31]'
};

const renderHandoverStatusCell = (item: ApprovalItem) => {
  const dbStatus = item.handoverQueueMeta?.handoverStatus ?? 'WAITING_CEO_APPROVAL';
  const statusLabel = mapHandoverDbStatusToLabel(dbStatus);
  const statusClass = handoverStatusStyleMap[statusLabel] ?? 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
      {statusLabel}
    </span>
  );
};

export const ApprovalTable = ({
  items,
  onView,
  onApprove,
  onRequestRevision,
  isReadOnly = false,
  handoverStatusColumn = false,
  footer
}: ApprovalTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]/80">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-none bg-[#eceef0]">
              <th className={`${thBase} text-left`}>Doc Code</th>
              <th className={`${thBase} text-left`}>Client &amp; Title</th>
              <th className={`${thBase} text-left`}>{handoverStatusColumn ? 'Status' : 'Type'}</th>
              <th className={`${thBase} text-left`}>Submitted By</th>
              <th className={`${thBase} text-left`}>Submitted At</th>
              <th className={`${thBase} text-center`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {items.map((item) => (
              <tr key={item.id} className="group transition-colors hover:bg-[#eceef0]/30">
                <td className="py-3.5 pl-5 pr-4">
                  <p className="font-mono text-xs font-bold text-[#003c90]">{item.docCode ?? '—'}</p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm font-bold text-[#191c1e] transition-colors group-hover:text-[#003c90]">
                    {item.client}
                  </p>
                  <p className="mt-1 text-xs text-[#737784]">{item.title}</p>
                  {item.serviceLine && (
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[#737784]">
                      {item.serviceLine}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  {handoverStatusColumn ? (
                    renderHandoverStatusCell(item)
                  ) : (
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${kindBadgeClass[item.kind]}`}
                    >
                      {APPROVAL_KIND_LABELS[item.kind]}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-xs font-medium text-[#434653]">{item.submittedBy}</td>
                <td className="px-4 py-3.5 text-xs font-medium text-[#434653]">{formatDate(item.submittedAt)}</td>
                <td className="py-3.5 pl-4 pr-5 align-middle">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => onView(item)}
                      className="inline-flex cursor-pointer text-[#737784] transition-colors hover:text-[#003c90] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d59c1]/40"
                      aria-label="View detail"
                      title="View detail"
                    >
                      <Eye className="h-4 w-4" strokeWidth={2} />
                    </button>
                    {!isReadOnly && (
                      <>
                        <button
                          type="button"
                          onClick={() => onRequestRevision(item)}
                          className="inline-flex cursor-pointer text-[#737784] transition-colors hover:text-[#a16207] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a16207]/40"
                          aria-label="Request revision"
                          title="Request revision"
                        >
                          <RotateCcw className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onApprove(item)}
                          className="inline-flex cursor-pointer text-[#737784] transition-colors hover:text-[#006544] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006544]/40"
                          aria-label="Approve"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" strokeWidth={2.4} />
                        </button>
                      </>
                    )}
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
