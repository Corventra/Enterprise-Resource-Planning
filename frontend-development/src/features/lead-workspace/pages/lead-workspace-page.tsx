import { ArrowLeft } from 'lucide-react';
import { Navigate, Outlet, useNavigate, useParams } from 'react-router';
import { PERMISSIONS } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { LeadWorkspaceCoreDetails } from '../components/lead-workspace-core-details';
import { LeadWorkspaceProposalSummaryCard } from '../components/lead-workspace-proposal-summary-card';
import { LeadWorkspaceTabs } from '../components/lead-workspace-tabs';
import { useLeadWorkspace } from '../hooks/use-lead-workspace';
import type { LeadWorkspace } from '../types/lead-workspace.types';

export type LeadWorkspaceOutletContext = {
  workspace: LeadWorkspace;
};

export const LeadWorkspacePage = () => {
  const navigate = useNavigate();
  const { leadId } = useParams();
  const { can } = useAuth();
  const { workspace, isLoading } = useLeadWorkspace(leadId);

  if (!leadId) {
    return <Navigate to="/lead-tracker" replace />;
  }

  if (!can(PERMISSIONS.LEAD_VIEW)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading lead workspace...
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 shadow-sm">
        <h1 className="text-base font-semibold text-[#191c1e]">Lead workspace not found</h1>
        <button
          type="button"
          onClick={() => navigate('/lead-tracker')}
          className="mt-3 rounded-lg border border-[#c3c6d5] px-3 py-1.5 text-xs font-medium text-[#191c1e] hover:bg-[#eceef0] sm:text-sm"
        >
          Back to Lead Tracker
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col items-start">
          <button
            type="button"
            onClick={() => navigate('/lead-tracker')}
            className="group inline-flex items-center text-xs font-medium text-[#434653] transition-colors hover:text-[#003c90] sm:text-sm"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 sm:h-4 sm:w-4" />
            Back to Lead Tracker
          </button>
          <div className="mt-2 mb-2 inline-flex rounded-full bg-[#d5e3fc] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#57657a] sm:text-[11px]">
            ID: {workspace.leadCode}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#191c1e] sm:text-3xl">{workspace.companyName}</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <LeadWorkspaceCoreDetails workspace={workspace} />
        <LeadWorkspaceProposalSummaryCard workspace={workspace} />
      </div>

      <LeadWorkspaceTabs leadId={leadId} />

      <Outlet context={{ workspace } satisfies LeadWorkspaceOutletContext} />
    </div>
  );
};
