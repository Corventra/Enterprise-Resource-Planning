import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
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
    actionError,
    successMessage,
    approveSelected,
    rejectSelected
  } = useApprovalProposals();
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

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading approval queue...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
        {loadError}
      </div>
    );
  }

  if (items.length === 0) {
    return <ApprovalEmptyState />;
  }

  const handleApprove = async () => {
    await approveSelected();
    await refreshQueue();
    setApproveOpen(false);
  };

  const handleReject = async (note: string) => {
    await rejectSelected(note);
    await refreshQueue();
    setRejectOpen(false);
  };

  return (
  <>
      {successMessage ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {successMessage}
        </p>
      ) : null}
      {actionError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p>
      ) : null}
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
    </>
  );
};
