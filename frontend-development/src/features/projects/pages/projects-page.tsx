import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ROLES } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { ProjectEmptyState } from '../components/list/project-empty-state';
import { ProjectFiltersSection } from '../components/list/project-filters';
import { ProjectSummaryCards } from '../components/list/project-summary-cards';
import { ProjectTable } from '../components/list/project-table';
import { useProjectFilters } from '../hooks/use-project-filters';
import { useProjectList } from '../hooks/use-project-list';

export const ProjectsPage = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { items, isLoading, summary } = useProjectList();
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
  } = useProjectFilters(items);

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages]
  );
  const rangeStart = filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredItems.length);

  const subtitle =
    role === ROLES.PM
      ? 'Project yang Anda kelola sebagai Project Manager.'
      : role === ROLES.CONSULTANT
        ? 'Project yang Anda kerjakan sebagai Consultant.'
        : 'Pantau dan kelola seluruh project pasca-handover.';

  const emptyReason: 'filters' | 'role-scope' =
    items.length === 0 && filters.search === '' && filters.status === 'All' && filters.serviceLine === 'All'
      ? 'role-scope'
      : 'filters';

  const paginationFooter =
    totalPages > 0 ? (
      <div className="flex flex-col gap-3 border-none bg-[#eceef0] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-[#737784] sm:text-sm">
          Showing{' '}
          <span className="font-bold text-[#191c1e]">
            {rangeStart} - {rangeEnd}
          </span>{' '}
          of {filteredItems.length.toLocaleString()} projects
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
          <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </header>

      <ProjectSummaryCards summary={summary} />

      <ProjectFiltersSection
        filters={filters}
        onSearchChange={(value) => updateFilter('search', value)}
        onStatusChange={(value) => updateFilter('status', value)}
        onServiceLineChange={(value) => updateFilter('serviceLine', value)}
        onReset={resetFilters}
      />

      {isLoading ? (
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
          Loading projects...
        </div>
      ) : filteredItems.length === 0 ? (
        <ProjectEmptyState onReset={resetFilters} reason={emptyReason} />
      ) : (
        <ProjectTable
          items={paginatedItems}
          onView={(item) => navigate(`/projects/${item.id}`)}
          footer={paginationFooter}
        />
      )}
    </div>
  );
};
