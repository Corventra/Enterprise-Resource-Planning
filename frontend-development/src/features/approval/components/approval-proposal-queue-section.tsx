import type { LeadWorkspaceProposalView } from '../../lead-workspace/types/lead-proposals.types';
import type { ApprovalItem } from '../types/approval.types';
import { formatProposalDateTime, getProposalStatusLabel } from '../utils/proposal-display';

interface ApprovalProposalQueueSectionProps {
  items: ApprovalItem[];
  proposalByApprovalId: Record<string, LeadWorkspaceProposalView | null>;
  selectedApprovalId?: string;
  onSelectApproval: (approvalId: string) => void;
}

export const ApprovalProposalQueueSection = ({
  items,
  proposalByApprovalId,
  selectedApprovalId,
  onSelectApproval
}: ApprovalProposalQueueSectionProps) => {
  return (
    <div className="col-span-12 flex flex-col gap-4 lg:col-span-7">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Proposal</h2>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="bg-[#f2f4f6]/70 text-[11px] font-bold uppercase tracking-wider text-[#737784]">
              <th className="w-[30%] px-5 py-3">Company</th>
              <th className="w-[24%] px-3 py-3">Service</th>
              <th className="w-[28%] px-4 py-3">Submitted By</th>
              <th className="w-[18%] px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-[#737784]">
                  Tidak ada proposal yang menunggu approval.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const proposal = proposalByApprovalId[item.id];
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
                    <td className="px-4 py-5 font-semibold text-[#191c1e]">{item.client}</td>
                    <td className="px-3 py-5 text-xs text-[#434653]">
                      <p className="truncate" title={proposal?.serviceName ?? item.serviceLine ?? '-'}>
                        {proposal?.serviceName ?? item.serviceLine ?? '-'}
                      </p>
                    </td>
                    <td className="px-3 py-5 text-xs text-[#434653]">
                      <p className="font-semibold text-[#191c1e]">
                        {proposal?.submittedByName ?? item.submittedBy ?? '-'}
                      </p>
                      <p className="mt-1 text-[#737784]">
                        {formatProposalDateTime(proposal?.submittedAt ?? item.submittedAt)}
                      </p>
                    </td>
                    <td className="px-3 py-5 text-xs font-semibold text-[#434653]">
                      {getProposalStatusLabel(proposal?.status)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
