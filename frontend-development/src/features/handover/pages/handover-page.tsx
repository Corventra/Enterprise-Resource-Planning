import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ROLES } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { HandoverEmptyState } from '../components/list/handover-empty-state';
import { HandoverFiltersSection } from '../components/list/handover-filters';
import { HandoverSummaryCards } from '../components/list/handover-summary-cards';
import { HandoverTable } from '../components/list/handover-table';
import { useHandoverFilters } from '../hooks/use-handover-filters';
import { useHandoverList } from '../hooks/use-handover-list';

export const HandoverPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, isLoading, summary, refetchSummary } = useHandoverList();
  const {
    filters,
    filteredItems,
    paginatedItems,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    updateFilter,
    resetFilters,
    serviceLineOptions,
    createdByFilterOptions,
    summaryCreatedByTarget
  } = useHandoverFilters(items);

  const canFilterSummaryByCreator =
    user?.role === ROLES.CEO || user?.role === ROLES.COO || user?.role === ROLES.SUPERADMIN;
  const skipInitialOrgSummarySync = useRef(true);

  useEffect(() => {
    if (!canFilterSummaryByCreator || isLoading) return;
    if (skipInitialOrgSummarySync.current) {
      skipInitialOrgSummarySync.current = false;
      if (summaryCreatedByTarget == null) return;
    }
    void refetchSummary(summaryCreatedByTarget);
  }, [canFilterSummaryByCreator, isLoading, summaryCreatedByTarget, refetchSummary]);

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
          of {filteredItems.length.toLocaleString()} handovers
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
          <h1 className="text-2xl font-semibold text-slate-900">Handover</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola dan pantau seluruh project handover memo.</p>
        </div>
      </header>

      <HandoverSummaryCards summary={summary} />

      <HandoverFiltersSection
        filters={filters}
        serviceLineOptions={serviceLineOptions}
        createdByFilterOptions={createdByFilterOptions}
        onSearchChange={(value) => updateFilter('search', value)}
        onServiceLineChange={(value) => updateFilter('serviceLine', value)}
        onCreatedByChange={(value) => updateFilter('createdBy', value)}
        onStatusChange={(value) => updateFilter('status', value)}
        onReset={resetFilters}
      />

      {isLoading ? (
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
          Loading handover list...
        </div>
      ) : filteredItems.length === 0 ? (
        <HandoverEmptyState onReset={resetFilters} />
      ) : (
        <HandoverTable
          items={paginatedItems}
          onView={(item) => navigate(`/handover/${item.id}`)}
          footer={paginationFooter}
        />
      )}
    </div>
  );
};
