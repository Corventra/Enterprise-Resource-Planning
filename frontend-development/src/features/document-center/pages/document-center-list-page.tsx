import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ROLES } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { DocumentCenterListEmptyState } from '../components/list/document-center-list-empty-state';
import { DocumentCenterListFiltersSection } from '../components/list/document-center-list-filters';
import { DocumentCenterListSummaryCards } from '../components/list/document-center-list-summary-cards';
import { DocumentCenterListTable } from '../components/list/document-center-list-table';
import { useDocumentCenterList } from '../hooks/use-document-center-list';
import { useDocumentCenterListFilters } from '../hooks/use-document-center-list-filters';

export const DocumentCenterListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const showHandledByFilter = user?.role === ROLES.CEO || user?.role === ROLES.COO || user?.role === ROLES.SUPERADMIN;

  const { items, summary, isLoading, loadError } = useDocumentCenterList();
  const {
    filters,
    filteredItems,
    paginatedItems,
    currentPage,
    totalPages,
    pageSize,
    handledByFilterOptions,
    stageFilterOptions,
    setCurrentPage,
    updateFilter,
    resetFilters
  } = useDocumentCenterListFilters(items);

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages]);
  const rangeStart = filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredItems.length);

  const openLead = (leadId: number) => {
    navigate(`/document-center/${leadId}`);
  };

  const paginationFooter =
    totalPages > 0 ? (
      <div className="flex flex-col gap-3 border-none bg-[#eceef0] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-[#737784] sm:text-sm">
          Menampilkan{' '}
          <span className="font-bold text-[#191c1e]">
            {rangeStart} - {rangeEnd}
          </span>{' '}
          dari {filteredItems.length.toLocaleString('id-ID')} lead
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="rounded-lg p-1.5 text-[#737784] transition-colors hover:bg-[#e0e3e5] disabled:opacity-30"
            aria-label="Halaman sebelumnya"
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
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[#191c1e]">Document Center</h1>
        <p className="mt-1 max-w-3xl text-sm text-[#737784]">
          Pusat dokumen terintegrasi untuk proposal, engagement letter, handover, invoice, dan project.
        </p>
      </header>

      <DocumentCenterListSummaryCards summary={summary} />

      <DocumentCenterListFiltersSection
        filters={filters}
        stageFilterOptions={stageFilterOptions}
        handledByFilterOptions={handledByFilterOptions}
        showHandledByFilter={showHandledByFilter}
        onSearchChange={(v) => updateFilter('search', v)}
        onStageChange={(v) => updateFilter('stage', v)}
        onHandledByChange={(v) => updateFilter('handledBy', v)}
        onCategoryChange={(v) => updateFilter('hasCategory', v)}
        onLastUpdatedChange={(v) => updateFilter('lastUpdated', v)}
        onReset={resetFilters}
      />

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl bg-white px-6 py-16 text-center text-sm text-[#737784] shadow-sm ring-1 ring-[#eceef0]">
          Memuat repository dokumen...
        </div>
      ) : filteredItems.length === 0 ? (
        <DocumentCenterListEmptyState />
      ) : (
        <DocumentCenterListTable
          items={paginatedItems}
          onOpen={(item) => openLead(item.leadId)}
          footer={paginationFooter}
        />
      )}
    </div>
  );
};
