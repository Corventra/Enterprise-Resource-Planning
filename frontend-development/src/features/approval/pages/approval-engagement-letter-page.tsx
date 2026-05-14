import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { ApprovalEngagementLetterDetailSection } from '../components/approval-engagement-letter-detail-section';
import { ApprovalEngagementLetterQueueSection } from '../components/approval-engagement-letter-queue-section';
import { ApprovalEmptyState } from '../components/approval-empty-state';
import { ApproveEngagementLetterDialog } from '../components/modals/approve-engagement-letter-dialog';
import { RejectEngagementLetterDialog } from '../components/modals/reject-engagement-letter-dialog';
import { approvalEngagementsService } from '../services/approval-engagements-service';
import type { ApprovalEngagementLetterQueueMeta, ApprovalOutletContext, ApprovalProposalLeadSummary } from '../types/approval.types';
import type { LeadWorkspaceEngagementLetterItem } from '../../lead-workspace/types/lead-engagement-letters.types';
import { mapApiEngagementWorkspaceItemToLeadItem } from '../../lead-workspace/utils/map-api-engagement-workspace-item';

export const ApprovalEngagementLetterPage = () => {
  const {
    pendingItems,
    selectedPendingId,
    setSelectedPendingId,
    queueLoading,
    isReadOnly,
    approve,
    requestRevision,
    refreshQueue
  } = useOutletContext<ApprovalOutletContext>();

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [leadSummary, setLeadSummary] = useState<ApprovalProposalLeadSummary | null>(null);
  const [engagementLines, setEngagementLines] = useState<LeadWorkspaceEngagementLetterItem[]>([]);

  const queueMetaByApprovalId = useMemo(() => {
    const m: Record<string, ApprovalEngagementLetterQueueMeta | undefined> = {};
    for (const item of pendingItems) {
      if (item.kind === 'EngagementLetter' && item.engagementQueueMeta) {
        m[item.id] = item.engagementQueueMeta;
      }
    }
    return m;
  }, [pendingItems]);

  const selectedApprovalItem = useMemo(
    () => pendingItems.find((item) => item.id === selectedPendingId) ?? null,
    [pendingItems, selectedPendingId]
  );

  useEffect(() => {
    if (!selectedPendingId || selectedApprovalItem?.kind !== 'EngagementLetter') {
      setLeadSummary(null);
      setEngagementLines([]);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);

    void (async () => {
      try {
        const data = await approvalEngagementsService.fetchDetail(selectedPendingId);
        if (cancelled) return;
        setLeadSummary(data.leadSummary);
        setEngagementLines([mapApiEngagementWorkspaceItemToLeadItem(data.item)]);
      } catch (e) {
        if (!cancelled) {
          setLeadSummary(null);
          setEngagementLines([]);
          setDetailError(e instanceof Error ? e.message : 'Gagal memuat detail engagement letter.');
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedApprovalItem?.kind, selectedPendingId]);

  const handleApprove = useCallback(async () => {
    if (!selectedApprovalItem) return;
    setActionBusy(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await approve(selectedApprovalItem);
      await refreshQueue();
      setApproveOpen(false);
      setActionSuccess('Engagement letter berhasil disetujui.');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Gagal menyetujui engagement letter.');
    } finally {
      setActionBusy(false);
    }
  }, [approve, refreshQueue, selectedApprovalItem]);

  const handleRequestRevision = useCallback(
    async (note: string) => {
      if (!selectedApprovalItem) return;
      setActionBusy(true);
      setActionError(null);
      setActionSuccess(null);
      try {
        await requestRevision(selectedApprovalItem, note);
        await refreshQueue();
        setRejectOpen(false);
        setActionSuccess('Permintaan revisi engagement letter telah dikirim.');
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Gagal mengirim permintaan revisi.');
      } finally {
        setActionBusy(false);
      }
    },
    [refreshQueue, requestRevision, selectedApprovalItem]
  );

  if (queueLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading approval queue...
      </div>
    );
  }

  if (pendingItems.length === 0) {
    return (
      <>
        {actionSuccess ? (
          <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {actionSuccess}
          </p>
        ) : null}
        {actionError ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p>
        ) : null}
        <ApprovalEmptyState />
        <ApproveEngagementLetterDialog
          open={approveOpen}
          busy={actionBusy}
          onClose={() => setApproveOpen(false)}
          onConfirm={handleApprove}
        />
        <RejectEngagementLetterDialog
          open={rejectOpen}
          busy={actionBusy}
          onClose={() => setRejectOpen(false)}
          onConfirm={handleRequestRevision}
        />
      </>
    );
  }

  return (
    <>
      {actionSuccess ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {actionSuccess}
        </p>
      ) : null}
      {actionError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p>
      ) : null}

      <section className="grid grid-cols-12 gap-6">
        <ApprovalEngagementLetterQueueSection
          items={pendingItems}
          queueMetaByApprovalId={queueMetaByApprovalId}
          selectedApprovalId={selectedPendingId ?? undefined}
          onSelectApproval={setSelectedPendingId}
        />
        <ApprovalEngagementLetterDetailSection
          key={selectedPendingId ?? 'none'}
          leadSummary={leadSummary}
          leadSummaryLoading={detailLoading}
          engagementLines={engagementLines}
          detailError={detailError}
          isReadOnly={isReadOnly}
          actionsDisabled={actionBusy}
          onApprove={!isReadOnly ? () => { setActionSuccess(null); setActionError(null); setApproveOpen(true); } : undefined}
          onRequestRevision={!isReadOnly ? () => { setActionSuccess(null); setActionError(null); setRejectOpen(true); } : undefined}
        />
      </section>

      <ApproveEngagementLetterDialog
        open={approveOpen}
        busy={actionBusy}
        onClose={() => setApproveOpen(false)}
        onConfirm={handleApprove}
      />
      <RejectEngagementLetterDialog
        open={rejectOpen}
        busy={actionBusy}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleRequestRevision}
      />
    </>
  );
};
