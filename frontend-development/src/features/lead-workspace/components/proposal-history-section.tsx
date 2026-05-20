import { useOutletContext } from 'react-router';
import { useLeadWorkspacePermissions } from '../hooks/use-lead-workspace-permissions';
import type { LeadWorkspaceOutletContext } from '../types/lead-workspace.types';
import type { LeadWorkspaceProposalView } from '../types/lead-proposals.types';

interface ProposalHistorySectionProps {
  proposal: LeadWorkspaceProposalView | null;
  isLoading: boolean;
  canCreateProposal?: boolean;
  onCreateProposal: () => void;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const statusLabelMap = {
  DRAFT: 'Draft',
  WAITING_CEO_APPROVAL: 'Waiting CEO Approval',
  NEED_REVISION: 'Need Revision',
  APPROVED: 'Approved',
  SENT: 'Sent',
  RESPONDED: 'Responded'
} as const;

const tableHead = (
  <thead>
    <tr className="bg-[#f2f4f6]/70 text-[11px] font-bold uppercase tracking-wider text-[#737784]">
      <th className="px-4 py-3">Code</th>
      <th className="px-5 py-3">Service</th>
      <th className="px-4 py-3">Issuer</th>
      <th className="px-4 py-3">Status</th>
      <th className="px-4 py-3">Created At</th>
      <th className="px-4 py-3 text-right">Discount</th>
      <th className="px-5 py-3 text-right">Proposal Fee</th>
    </tr>
  </thead>
);

export const ProposalHistorySection = ({
  proposal,
  isLoading,
  canCreateProposal = false,
  onCreateProposal
}: ProposalHistorySectionProps) => {
  const { processedByUserId } = useOutletContext<LeadWorkspaceOutletContext>();
  const { canManageLeadWorkspace } = useLeadWorkspacePermissions({ processedByUserId });
  const showCreate = canManageLeadWorkspace && !proposal && canCreateProposal;

  return (
    <div className="col-span-12 flex flex-col gap-4 lg:col-span-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Proposal</h2>
        {showCreate ? (
          <button
            type="button"
            onClick={onCreateProposal}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#003c90]/20 transition-opacity hover:opacity-90 sm:text-sm"
          >
            Create Proposal
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        <table className="w-full border-collapse text-left">
          {tableHead}
          <tbody className="text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-[#737784]">
                  Memuat proposal…
                </td>
              </tr>
            ) : !proposal ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-[#737784]">
                  Belum ada proposal untuk lead ini.
                </td>
              </tr>
            ) : (
              <tr className="border-l-4 border-[#003c90] bg-[#003c90]/5">
                <td className="px-4 py-5 font-mono text-xs font-bold text-[#003c90]">{proposal.proposalCode || '—'}</td>
                <td className="px-4 py-5 font-semibold text-[#191c1e]">{proposal.serviceName}</td>
                <td className="px-3 py-5 text-xs text-[#434653]">{proposal.issuerCompany}</td>
                <td className="px-3 py-5 text-xs font-semibold text-[#434653]">{statusLabelMap[proposal.status]}</td>
                <td className="px-3 py-5 text-xs text-[#434653]">{formatDateTime(proposal.createdAt)}</td>
                <td className="px-4 py-5 text-right text-xs font-semibold text-[#ba1a1a]">
                  {formatCurrency(proposal.discountAmount)}
                </td>
                <td className="px-6 py-5 text-right text-xs font-semibold text-[#191c1e]">
                  {formatCurrency(proposal.proposalFee)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
