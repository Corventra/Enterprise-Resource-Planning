import type { ApprovalEngagementLetterQueueMeta, ApprovalItem } from '../types/approval.types';
import { formatProposalDateTime } from '../utils/proposal-display';
import {
  engagementStatusClassMap,
  engagementStatusLabelMap,
  paymentMethodLabelMap
} from '../../lead-workspace/utils/engagement-letter-labels';

interface ApprovalEngagementLetterQueueSectionProps {
  items: ApprovalItem[];
  queueMetaByApprovalId?: Record<string, ApprovalEngagementLetterQueueMeta | undefined>;
  selectedApprovalId?: string;
  onSelectApproval: (approvalId: string) => void;
}

const dash = (v?: string | null) => {
  if (v === undefined || v === null) return '-';
  const t = String(v).trim();
  return t === '' ? '-' : t;
};

export const ApprovalEngagementLetterQueueSection = ({
  items,
  queueMetaByApprovalId = {},
  selectedApprovalId,
  onSelectApproval
}: ApprovalEngagementLetterQueueSectionProps) => {
  return (
    <div className="col-span-12 flex flex-col gap-4 lg:col-span-7">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Engagement letter</h2>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="bg-[#f2f4f6]/70 text-[11px] font-bold uppercase tracking-wider text-[#737784]">
                <th className="px-4 py-3">Company</th>
                <th className="px-3 py-3">Issuer</th>
                <th className="px-3 py-3">Payment</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Submitted by</th>
                <th className="px-3 py-3">Submitted at</th>
                <th className="px-4 py-3 text-right">Agreed fee</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-[#737784]">
                    Tidak ada engagement letter yang menunggu approval.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const meta = item.engagementQueueMeta ?? queueMetaByApprovalId[item.id];
                  const status = meta?.engagementStatus;
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
                      <td className="px-4 py-4 text-xs font-semibold text-[#191c1e]">{dash(item.client)}</td>
                      <td className="px-3 py-4 text-xs text-[#434653]">{dash(meta?.issuerCompany)}</td>
                      <td className="px-3 py-4 text-xs text-[#434653]">
                        {meta?.paymentMethod ? paymentMethodLabelMap[meta.paymentMethod] : '-'}
                      </td>
                      <td className="px-3 py-4">
                        {status ? (
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${engagementStatusClassMap[status]}`}
                          >
                            {engagementStatusLabelMap[status]}
                          </span>
                        ) : (
                          <span className="text-xs text-[#737784]">-</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-xs font-medium text-[#434653]">{dash(item.submittedBy)}</td>
                      <td className="px-3 py-4 text-xs text-[#434653]">{formatProposalDateTime(item.submittedAt)}</td>
                      <td className="px-4 py-4 text-right text-xs font-semibold text-[#191c1e]">
                        {dash(meta?.agreedFeeDisplay)}
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
