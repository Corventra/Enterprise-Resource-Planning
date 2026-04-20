import { FileBadge2 } from 'lucide-react';
import { useOutletContext } from 'react-router';
import type { LeadWorkspaceOutletContext } from './lead-workspace-page';

export const ProposalPage = () => {
  const { workspace } = useOutletContext<LeadWorkspaceOutletContext>();
  const proposal = workspace.proposal;

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Active Proposal</p>
          <h3 className="mt-1 text-xl font-bold text-[#191c1e]">{proposal.title}</h3>
          <p className="text-xs text-[#515f74]">{proposal.serviceType}</p>
        </div>
        <FileBadge2 className="h-5 w-5 text-[#003c90]" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-[#f2f4f6] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#737784]">Estimated Fee</p>
          <p className="mt-1 text-lg font-bold text-[#191c1e]">{proposal.estimatedFee}</p>
        </div>
        <div className="rounded-lg bg-[#f2f4f6] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#737784]">Payment Terms</p>
          <p className="mt-1 text-sm font-semibold text-[#191c1e]">{proposal.paymentTerms}</p>
        </div>
        <div className="rounded-lg bg-[#f2f4f6] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#737784]">Status</p>
          <p className="mt-1 text-sm font-semibold text-[#00419c]">{proposal.status}</p>
        </div>
      </div>
    </section>
  );
};
