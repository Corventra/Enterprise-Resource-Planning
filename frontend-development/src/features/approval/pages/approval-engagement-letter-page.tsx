import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useOutletContext } from 'react-router';
import { Toast } from '../../../components/ui/toast';
import { useToast } from '../../../hooks/use-toast';
import { APPROVAL_ENGAGEMENT_LETTER_TOAST } from '../constants/approval-engagement-letter-toast';
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

  const { message: toastMessage, variant: toastVariant, dismiss: dismissToast, show: showToast } = useToast();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

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
    try {
      await approve(selectedApprovalItem);
      setApproveOpen(false);
      showToast(APPROVAL_ENGAGEMENT_LETTER_TOAST.approved);
      await refreshQueue({ silent: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Gagal menyetujui engagement letter.';
      showToast(message, { variant: 'error' });
    } finally {
      setActionBusy(false);
    }
  }, [approve, refreshQueue, selectedApprovalItem, showToast]);

  const handleRequestRevision = useCallback(
    async (note: string) => {
      if (!selectedApprovalItem) return;
      setActionBusy(true);
      try {
        await requestRevision(selectedApprovalItem, note);
        setRejectOpen(false);
        showToast(APPROVAL_ENGAGEMENT_LETTER_TOAST.rejected);
        await refreshQueue({ silent: true });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Gagal mengirim permintaan revisi.';
        showToast(message, { variant: 'error' });
      } finally {
        setActionBusy(false);
      }
    },
    [refreshQueue, requestRevision, selectedApprovalItem, showToast]
  );

  let body: ReactNode;

  if (queueLoading) {
    body = (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading approval queue...
      </div>
    );
  } else if (pendingItems.length === 0) {
    body = <ApprovalEmptyState />;
  } else {
    body = (
      <>
        {detailError ? (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{detailError}</p>
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
            onApprove={!isReadOnly ? () => setApproveOpen(true) : undefined}
            onRequestRevision={!isReadOnly ? () => setRejectOpen(true) : undefined}
          />
        </section>
      </>
    );
  }

  return (
    <>
      {body}

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

      <Toast
        open={toastMessage != null}
        message={toastMessage ?? ''}
        variant={toastVariant}
        onClose={dismissToast}
      />
    </>
  );
};
