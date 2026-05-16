import type { ApprovalItem } from '../types/approval.types';
import { mapHandoverDbStatusToLabel, handoverStatusStyleMap } from '../../handover/types/handover.types';
import { formatProposalDateTime } from '../utils/proposal-display';

interface ApprovalHandoverQueueSectionProps {
  items: ApprovalItem[];
  selectedApprovalId?: string;
  onSelectApproval: (approvalId: string) => void;
}

const dash = (v?: string | null) => {
  if (v === undefined || v === null) return '-';
  const t = String(v).trim();
  return t === '' ? '-' : t;
};

export const ApprovalHandoverQueueSection = ({
  items,
  selectedApprovalId,
  onSelectApproval
}: ApprovalHandoverQueueSectionProps) => {
  return (
    <div className="col-span-12 flex flex-col gap-4 lg:col-span-7">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Handover memo</h2>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="bg-[#f2f4f6]/70 text-[11px] font-bold uppercase tracking-wider text-[#737784]">
                <th className="px-4 py-3">Doc Code</th>
                <th className="px-3 py-3">Client &amp; Project</th>
                <th className="px-3 py-3">Service</th>
                <th className="px-3 py-3">Submitted By</th>
                <th className="px-3 py-3">Submitted At</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-[#737784]">
                    Tidak ada handover yang menunggu approval.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const dbStatus = item.handoverQueueMeta?.handoverStatus ?? 'WAITING_CEO_APPROVAL';
                  const statusLabel = mapHandoverDbStatusToLabel(dbStatus);
                  const statusClass = handoverStatusStyleMap[statusLabel] ?? 'bg-slate-100 text-slate-700';
                  const isSelected = item.id === selectedApprovalId;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectApproval(item.id)}
                      className={
                        isSelected
                          ? 'cursor-pointer border-l-4 border-[#003c90] bg-[#003c90]/5 transition-colors'
                          : 'cursor-pointer border-b border-[#eceef0] transition-colors hover:bg-[#f2f4f6]'
                      }
                    >
                      <td className="px-4 py-4 text-xs font-semibold text-[#191c1e]">{dash(item.docCode)}</td>
                      <td className="px-3 py-4">
                        <p className="text-xs font-semibold text-[#191c1e]">{dash(item.client)}</p>
                        <p className="mt-0.5 text-[11px] text-[#737784]">{dash(item.title)}</p>
                      </td>
                      <td className="px-3 py-4 text-xs text-[#434653]">{dash(item.serviceLine)}</td>
                      <td className="px-3 py-4 text-xs font-medium text-[#434653]">{dash(item.submittedBy)}</td>
                      <td className="px-3 py-4 text-xs text-[#434653]">{formatProposalDateTime(item.submittedAt)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
