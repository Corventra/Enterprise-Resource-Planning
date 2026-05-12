import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { PERMISSIONS } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { AddManualLeadDialog } from '../components/modals/add-manual-lead-dialog';
import { MarkLeadLostDialog } from '../components/modals/mark-lead-lost-dialog';
import { LeadTrackerEmptyState } from '../components/list/lead-tracker-empty-state';
import { LeadTrackerFiltersSection } from '../components/list/lead-tracker-filters';
import { LeadTrackerSummaryCards } from '../components/list/lead-tracker-summary-cards';
import { LeadTrackerTable } from '../components/list/lead-tracker-table';
import { useLeadTrackerFilters } from '../hooks/use-lead-tracker-filters';
import { useLeadTrackerList } from '../hooks/use-lead-tracker-list';
import type { CreateManualLeadPayload, LeadTrackerItem, MarkLeadLostPayload } from '../types/lead-tracker.types';

export const LeadTrackerPage = () => {
  const navigate = useNavigate();
  const { can } = useAuth();
  const allowLeadManage = can(PERMISSIONS.LEAD_MANAGE);
  const { items, isLoading, loadError, summary, createManualLead, markLeadLost } = useLeadTrackerList();
  const [addManualOpen, setAddManualOpen] = useState(false);
  const [lostTarget, setLostTarget] = useState<LeadTrackerItem | undefined>();
  const [mutationBusy, setMutationBusy] = useState(false);
  const {
    filters,
    filteredItems,
    paginatedItems,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    updateFilter,
    resetFilters
  } = useLeadTrackerFilters(items);

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, index) => index + 1), [totalPages]);
  const rangeStart = filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredItems.length);

  const runCreateManualLead = async (payload: CreateManualLeadPayload) => {
    setMutationBusy(true);
    try {
      await createManualLead(payload);
      setAddManualOpen(false);
    } finally {
      setMutationBusy(false);
    }
  };

  const runMarkLeadLost = async (item: LeadTrackerItem, payload: MarkLeadLostPayload) => {
    setMutationBusy(true);
    try {
      await markLeadLost(item.id, payload);
      setLostTarget(undefined);
    } finally {
      setMutationBusy(false);
    }
  };

  const paginationFooter =
    totalPages > 0 ? (
      <div className="flex flex-col gap-3 border-none bg-[#eceef0] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-[#737784] sm:text-sm">
          Showing{' '}
          <span className="font-bold text-[#191c1e]">
            {rangeStart} - {rangeEnd}
          </span>{' '}
          of {filteredItems.length.toLocaleString()} leads
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="rounded-lg p-1.5 text-[#737784] transition-colors hover:bg-[#e0e3e5] disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={
                page === currentPage
                  ? 'flex h-7 w-7 items-center justify-center rounded-md bg-[#003c90] text-xs font-bold text-white shadow-sm shadow-[#003c90]/20'
                  : 'flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium text-[#737784] transition-colors hover:bg-[#e0e3e5]'
              }
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="rounded-lg p-1.5 text-[#737784] transition-colors hover:bg-[#e0e3e5] disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Lead Tracker</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor pipeline progression for processed leads and follow up by due date.
          </p>
        </div>
        {allowLeadManage ? (
          <button
            type="button"
            onClick={() => setAddManualOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add Lead
          </button>
        ) : null}
      </header>

      <LeadTrackerSummaryCards summary={summary} />

      <LeadTrackerFiltersSection
        filters={filters}
        onSearchChange={(value) => updateFilter('search', value)}
        onStageChange={(value) => updateFilter('stage', value)}
        onStatusChange={(value) => updateFilter('status', value)}
        onReset={resetFilters}
      />

      {isLoading ? (
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
          Loading lead tracker...
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">{loadError}</div>
      ) : filteredItems.length === 0 ? (
        <LeadTrackerEmptyState onReset={resetFilters} />
      ) : (
        <LeadTrackerTable
          items={paginatedItems}
          allowMarkLost={allowLeadManage}
          onView={(item) => navigate(`/lead-workspace/${item.id}`)}
          onMarkLost={(item) => setLostTarget(item)}
          footer={paginationFooter}
        />
      )}

      <AddManualLeadDialog
        open={addManualOpen}
        busy={mutationBusy}
        onClose={() => setAddManualOpen(false)}
        onSubmit={runCreateManualLead}
      />

      <MarkLeadLostDialog
        open={Boolean(lostTarget)}
        item={lostTarget}
        busy={mutationBusy}
        onClose={() => setLostTarget(undefined)}
        onConfirm={runMarkLeadLost}
      />
    </div>
  );
};
