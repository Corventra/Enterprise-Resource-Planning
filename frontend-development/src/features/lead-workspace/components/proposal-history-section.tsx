import { Plus } from 'lucide-react';
import { useLeadWorkspacePermissions } from '../hooks/use-lead-workspace-permissions';
import type { LeadWorkspaceProposalItem } from '../types/lead-workspace.types';

interface ProposalHistorySectionProps {
  proposals: LeadWorkspaceProposalItem[];
  selectedProposalId?: string;
  onSelectProposal: (proposalId: string) => void;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const ProposalHistorySection = ({ proposals, selectedProposalId, onSelectProposal }: ProposalHistorySectionProps) => {
  const { canManageLeadWorkspace } = useLeadWorkspacePermissions();
  return (
    <div className="col-span-12 flex flex-col gap-4 lg:col-span-7">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Proposal</h2>
        {canManageLeadWorkspace ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#003c90]/20 transition-opacity hover:opacity-90 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            Create Proposal
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#f2f4f6]/70 text-[11px] font-bold uppercase tracking-wider text-[#737784]">
              <th className="px-5 py-3">Title</th>
              <th className="px-4 py-3">Created At</th>
              <th className="px-4 py-3">Payment Type</th>
              <th className="px-4 py-3">Subcon</th>
              <th className="px-4 py-3">Sent At</th>
              <th className="px-4 py-3">Deal Date</th>
              <th className="px-4 py-3">Proposal Fee</th>
              <th className="px-5 py-3 text-right">Harga Deal</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-sm text-[#737784]">
                  No proposal data available.
                </td>
              </tr>
            ) : (
              proposals.map((proposal) => (
                <tr
                  key={proposal.id}
                  onClick={() => onSelectProposal(proposal.id)}
                  className={
                    proposal.id === selectedProposalId
                      ? 'cursor-pointer border-l-4 border-[#003c90] bg-[#003c90]/5 transition-colors'
                      : 'cursor-pointer border-b border-[#eceef0] transition-colors hover:bg-[#f2f4f6]'
                  }
                >
                  <td className="px-4 py-5 font-semibold text-[#191c1e]">{proposal.title}</td>
                  <td className="px-3 py-5 text-xs text-[#434653]">{formatDateTime(proposal.createdAt)}</td>
                  <td className="px-3 py-5 text-xs text-[#434653]">{proposal.paymentType}</td>
                  <td className="px-3 py-5 text-xs text-[#434653]">{proposal.subcon}</td>
                  <td className="px-3 py-5 text-xs text-[#434653]">{formatDateTime(proposal.sentAt)}</td>
                  <td className="px-3 py-5 text-xs text-[#434653]">{formatDate(proposal.dealDate)}</td>
                  <td className="px-3 py-5 text-xs font-semibold text-[#434653]">{proposal.proposalFee}</td>
                  <td className="px-6 py-5 text-right text-xs font-semibold text-[#191c1e]">{proposal.dealPrice}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
