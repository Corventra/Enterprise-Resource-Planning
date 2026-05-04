import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { LeadTrackerEmptyState } from '../components/list/lead-tracker-empty-state';
import { LeadTrackerFiltersSection } from '../components/list/lead-tracker-filters';
import { LeadTrackerSummaryCards } from '../components/list/lead-tracker-summary-cards';
import { LeadTrackerTable } from '../components/list/lead-tracker-table';
import { useLeadTrackerFilters } from '../hooks/use-lead-tracker-filters';
import { useLeadTrackerList } from '../hooks/use-lead-tracker-list';

export const LeadTrackerPage = () => {
  const navigate = useNavigate();
  const { items, isLoading, summary } = useLeadTrackerList();
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
            Monitor lead stage progression and maintain handover readiness by due date.
          </p>
        </div>
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
      ) : filteredItems.length === 0 ? (
        <LeadTrackerEmptyState onReset={resetFilters} />
      ) : (
        <LeadTrackerTable
          items={paginatedItems}
          onView={(item) => navigate(`/lead-workspace/${item.id}`)}
          footer={paginationFooter}
        />
      )}
    </div>
  );
};
