import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useOutletContext } from 'react-router';
import { Toast } from '../../../components/ui/toast';
import { useToast } from '../../../hooks/use-toast';
import { APPROVAL_PROPOSAL_TOAST } from '../constants/approval-proposal-toast';
import { ApprovalEmptyState } from '../components/approval-empty-state';
import { ApprovalProposalDetailSection } from '../components/approval-proposal-detail-section';
import { ApproveProposalDialog } from '../components/modals/approve-proposal-dialog';
import { RejectProposalDialog } from '../components/modals/reject-proposal-dialog';
import { ApprovalProposalQueueSection } from '../components/approval-proposal-queue-section';
import { ApprovalSearch, type ApprovalQueueSortOrder } from '../components/approval-search';
import { useApprovalProposals } from '../hooks/use-approval-proposals';
import { getProposalStatusLabel } from '../utils/proposal-display';
import type { ApprovalOutletContext } from '../types/approval.types';

export const ApprovalProposalPage = () => {
  const { isReadOnly, refreshQueue } = useOutletContext<ApprovalOutletContext>();
  const {
    items,
    proposalsById,
    selectedProposalId,
    setSelectedProposalId,
    selectedProposal,
    selectedLeadSummary,
    isLoading,
    detailLoading,
    actionBusy,
    loadError,
    detailError,
    approveSelected,
    rejectSelected
  } = useApprovalProposals();
  const { message: toastMessage, variant: toastVariant, dismiss: dismissToast, show: showToast } = useToast();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<ApprovalQueueSortOrder>('newest');

  const getSubmittedTimestamp = (item: (typeof items)[number]) => {
    const submittedAt = proposalsById[item.id]?.submittedAt ?? item.submittedAt;
    const timestamp = Date.parse(submittedAt);
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = !query
      ? items
      : items.filter((item) => {
          const proposal = proposalsById[item.id];
          const haystack = [
            item.client,
            proposal?.serviceName,
            item.serviceLine,
            proposal?.submittedByName,
            item.submittedBy,
            getProposalStatusLabel(proposal?.status)
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return haystack.includes(query);
        });

    return [...filtered].sort((a, b) => {
      const diff = getSubmittedTimestamp(b) - getSubmittedTimestamp(a);
      return sortOrder === 'newest' ? diff : -diff;
    });
  }, [items, proposalsById, search, sortOrder]);

  const handleResetFilters = () => {
    setSearch('');
    setSortOrder('newest');
  };

  useEffect(() => {
    if (visibleItems.length === 0) {
      return;
    }

    const isStillVisible = selectedProposalId && visibleItems.some((item) => item.id === selectedProposalId);
    if (!isStillVisible) {
      setSelectedProposalId(visibleItems[0].id);
    }
  }, [visibleItems, selectedProposalId, setSelectedProposalId]);

  const handleApprove = async () => {
    try {
      await approveSelected();
      setApproveOpen(false);
      showToast(APPROVAL_PROPOSAL_TOAST.approved);
      await refreshQueue();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Gagal menyetujui proposal.';
      showToast(message, { variant: 'error' });
    }
  };

  const handleReject = async (note: string) => {
    try {
      await rejectSelected(note);
      setRejectOpen(false);
      showToast(APPROVAL_PROPOSAL_TOAST.rejected);
      await refreshQueue();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Gagal menolak proposal.';
      showToast(message, { variant: 'error' });
    }
  };

  let body: ReactNode;

  if (isLoading) {
    body = (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading approval queue...
      </div>
    );
  } else if (loadError) {
    body = (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">{loadError}</div>
    );
  } else if (items.length === 0) {
    body = <ApprovalEmptyState />;
  } else {
    body = (
      <>
        {detailError ? (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{detailError}</p>
        ) : null}

        <div className="space-y-4">
          <ApprovalSearch
            search={search}
            onSearchChange={setSearch}
            onReset={handleResetFilters}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />

          {visibleItems.length === 0 ? (
            <ApprovalEmptyState onReset={search || sortOrder !== 'newest' ? handleResetFilters : undefined} />
          ) : (
            <section className="grid grid-cols-12 gap-6">
              <ApprovalProposalQueueSection
                items={visibleItems}
                proposalByApprovalId={proposalsById}
                selectedApprovalId={selectedProposalId ?? undefined}
                onSelectApproval={setSelectedProposalId}
              />
              <ApprovalProposalDetailSection
                proposal={selectedProposal}
                leadSummary={selectedLeadSummary}
                leadSummaryLoading={detailLoading}
                isReadOnly={isReadOnly}
                actionsDisabled={detailLoading || actionBusy}
                onApprove={!isReadOnly ? () => setApproveOpen(true) : undefined}
                onReject={!isReadOnly ? () => setRejectOpen(true) : undefined}
              />
            </section>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {body}

      <ApproveProposalDialog
        open={approveOpen}
        busy={actionBusy}
        onClose={() => setApproveOpen(false)}
        onConfirm={handleApprove}
      />
      <RejectProposalDialog
        open={rejectOpen}
        busy={actionBusy}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
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
