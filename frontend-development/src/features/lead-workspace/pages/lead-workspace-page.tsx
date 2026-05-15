import { ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useNavigate, useParams } from 'react-router';
import { PERMISSIONS } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { EditLeadWorkspaceCoreDetailsDialog } from '../components/modals/edit-lead-workspace-core-details-dialog';
import { LeadWorkspaceCoreDetails } from '../components/lead-workspace-core-details';
import { LeadWorkspaceActivityLogPanel } from '../components/lead-workspace-activity-log-panel';
import { LeadWorkspaceTabs } from '../components/lead-workspace-tabs';
import { useLeadWorkspace } from '../hooks/use-lead-workspace';
import { useLeadWorkspacePermissions } from '../hooks/use-lead-workspace-permissions';
import type { LeadWorkspaceOutletContext, UpdateLeadWorkspaceDetailsPayload } from '../types/lead-workspace.types';
import { buildLeadWorkspacePreview } from '../utils/lead-workspace-preview';

export const LeadWorkspacePage = () => {
  const navigate = useNavigate();
  const { leadId } = useParams();
  const { can } = useAuth();
  const { workspace, isLoading, loadError, updateDetails, refetch } = useLeadWorkspace(leadId);
  const [editOpen, setEditOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const workspacePreview = useMemo(
    () => (workspace ? buildLeadWorkspacePreview(workspace) : undefined),
    [workspace]
  );
  const { canViewLeadWorkspace, canManageLeadWorkspace } = useLeadWorkspacePermissions({
    processedByUserId: workspace?.processedByUserId ?? null
  });

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

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

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
        <h1 className="text-base font-semibold text-red-800">Gagal memuat Lead Workspace</h1>
        <p className="mt-1 text-sm text-red-700">{loadError}</p>
        <button
          type="button"
          onClick={() => navigate('/lead-tracker')}
          className="mt-3 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-100 sm:text-sm"
        >
          Back to Lead Tracker
        </button>
      </div>
    );
  }

  if (!workspace || !workspacePreview) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 shadow-sm">
        <h1 className="text-base font-semibold text-[#191c1e]">Lead workspace not found</h1>
        <p className="mt-1 text-sm text-[#737784]">Lead tidak ditemukan atau tidak tersedia di workspace.</p>
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

  const runUpdateDetails = async (payload: UpdateLeadWorkspaceDetailsPayload) => {
    setSaveBusy(true);
    try {
      await updateDetails(payload);
      setEditOpen(false);
      setSuccessMessage('Detail lead berhasil diperbarui.');
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {successMessage}
        </p>
      ) : null}

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
            {workspace.leadCode}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#191c1e] sm:text-3xl">{workspace.companyName}</h1>
        </div>
      </header>

      {canViewLeadWorkspace && !canManageLeadWorkspace ? (
        <p className="text-xs text-[#737784]">Workspace ini dikelola oleh BD yang memproses lead.</p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <LeadWorkspaceCoreDetails workspace={workspace} onEdit={() => setEditOpen(true)} />
        <LeadWorkspaceActivityLogPanel items={workspace.activityLogs} />
      </div>

      <LeadWorkspaceTabs leadId={leadId} />

      <Outlet
        context={
          {
            workspace: workspacePreview,
            leadId,
            processedByUserId: workspace.processedByUserId,
            refetchWorkspace: refetch
          } satisfies LeadWorkspaceOutletContext
        }
      />

      <EditLeadWorkspaceCoreDetailsDialog
        open={editOpen}
        workspace={workspace}
        busy={saveBusy}
        onClose={() => setEditOpen(false)}
        onSubmit={runUpdateDetails}
      />
    </div>
  );
};
