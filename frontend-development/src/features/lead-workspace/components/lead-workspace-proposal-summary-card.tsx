import { FileText, SquareArrowOutUpRight } from 'lucide-react';
import { useLeadWorkspacePermissions } from '../hooks/use-lead-workspace-permissions';
import type { LeadWorkspace } from '../types/lead-workspace.types';

interface LeadWorkspaceProposalSummaryCardProps {
  workspace: LeadWorkspace;
}

export const LeadWorkspaceProposalSummaryCard = ({ workspace }: LeadWorkspaceProposalSummaryCardProps) => {
  const { canViewLeadWorkspace } = useLeadWorkspacePermissions();
  return (
    <section className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-[linear-gradient(135deg,#001f5c_0%,#003c90_45%,#1e63d6_100%)] p-6 text-white shadow-sm lg:col-span-4">
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
            Active Proposal
          </span>
          <FileText className="h-4 w-4" />
        </div>
        <h3 className="mb-1 text-2xl font-bold">{workspace.proposal.title}</h3>
        <p className="text-xs text-white/70">{workspace.proposal.serviceType}</p>
      </div>
      <div className="relative z-10 mt-8">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">Estimated Fee</p>
        <p className="text-3xl font-extrabold">{workspace.proposal.estimatedFee}</p>
        <p className="mt-1 text-[10px] text-white/60">{workspace.proposal.paymentTerms}</p>
      </div>
      {canViewLeadWorkspace ? (
        <button
          type="button"
          className="relative z-10 mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 text-sm font-bold text-[#003c90] transition-colors hover:bg-white/90"
        >
          View Full Proposal
          <SquareArrowOutUpRight className="h-4 w-4" />
        </button>
      ) : null}
      <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -left-5 top-1/2 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
    </section>
  );
};
