import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { ROLES } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { buildLeadWorkspacePreview } from '../../lead-workspace/utils/lead-workspace-preview';
import { ApprovalSummaryCards } from '../components/approval-summary-cards';
import { ApprovalTabs } from '../components/approval-tabs';
import { useApprovalQueue } from '../hooks/use-approval-queue';
import type { ApprovalKind, ApprovalOutletContext, ApprovalTab } from '../types/approval.types';

const tabKindMap: Record<ApprovalTab, ApprovalKind> = {
  proposal: 'Proposal',
  'engagement-letter': 'EngagementLetter',
  handover: 'HandoverMemo'
};

const resolveApprovalTab = (pathname: string): ApprovalTab => {
  if (pathname.includes('/engagement-letter')) return 'engagement-letter';
  if (pathname.includes('/handover')) return 'handover';
  return 'proposal';
};

const emptyWorkspacePreview = buildLeadWorkspacePreview({
  id: '',
  leadCode: '',
  companyName: '',
  address: '',
  desiredServices: null,
  companyPicName: '',
  companyPicPhone: '',
  companyPicEmail: '',
  leadSource: '',
  processedAt: null,
  processedBy: null,
  processedByUserId: null,
  updatedAt: null,
  activityLogs: []
});

export const ApprovalCenterPage = () => {
  const { role } = useAuth();
  const location = useLocation();
  const activeTab = resolveApprovalTab(location.pathname);
  const { items, isLoading, summary, approve, requestRevision, refresh } = useApprovalQueue();
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);

  const pendingItems = useMemo(
    () => items.filter((item) => item.kind === tabKindMap[activeTab]),
    [activeTab, items]
  );

  useEffect(() => {
    if (pendingItems.length === 0) {
      setSelectedPendingId(null);
      return;
    }

    const isStillAvailable = pendingItems.some((item) => item.id === selectedPendingId);
    if (!isStillAvailable) {
      setSelectedPendingId(pendingItems[0].id);
    }
  }, [pendingItems, selectedPendingId]);

  const isReadOnly = role === ROLES.COO;

  const outletContext = {
    workspace: emptyWorkspacePreview,
    leadId: '',
    processedByUserId: null,
    refetchWorkspace: async () => {},
    pendingItems,
    selectedPendingId,
    setSelectedPendingId,
    queueLoading: isLoading,
    isReadOnly,
    approve,
    requestRevision,
    refreshQueue: refresh
  } satisfies ApprovalOutletContext;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#191c1e]">Approval Center</h1>
          <p className="mt-1 text-sm text-[#737784]">
            {isReadOnly
              ? 'Pantau proposal, engagement letter, dan handover yang menunggu approval CEO.'
              : 'Review dan approve proposal, engagement letter, dan handover yang menunggu sign-off Anda.'}
          </p>
        </div>
      </header>

      <ApprovalSummaryCards summary={summary} />

      <ApprovalTabs />

      <Outlet context={outletContext} />
    </div>
  );
};
