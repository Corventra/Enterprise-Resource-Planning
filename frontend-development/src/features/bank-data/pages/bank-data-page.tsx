import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PERMISSIONS } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { BankDataEmptyState } from '../components/list/bank-data-empty-state';
import { BankDataFiltersSection } from '../components/list/bank-data-filters';
import { BankDataSummaryCards } from '../components/list/bank-data-summary-cards';
import { BankDataTable } from '../components/list/bank-data-table';
import { BankDataEntryDetailModal } from '../components/modals/bank-data-entry-detail-modal';
import { useBankDataFilters } from '../hooks/use-bank-data-filters';
import { useBankDataList } from '../hooks/use-bank-data-list';
import type { BankDataEntry } from '../types/bank-data.types';

export const BankDataPage = () => {
  const { can } = useAuth();
  const allowBankDataMutations = can(PERMISSIONS.BANK_DATA_PROCESS);
  const { entries, isLoading, summary, processEntry, archiveEntry } = useBankDataList();
  const [selectedEntry, setSelectedEntry] = useState<BankDataEntry | undefined>();
  const {
    filters,
    filteredEntries,
    paginatedEntries,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    updateFilter,
    resetFilters
  } = useBankDataFilters(entries);

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, index) => index + 1), [totalPages]);
  const rangeStart = filteredEntries.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredEntries.length);

  const onViewEntry = (entry: BankDataEntry) => {
    setSelectedEntry(entry);
  };

  const paginationFooter =
    totalPages > 0 ? (
      <div className="flex flex-col gap-3 border-none bg-[#eceef0] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-[#737784] sm:text-sm">
          Showing{' '}
          <span className="font-bold text-[#191c1e]">
            {rangeStart} - {rangeEnd}
          </span>{' '}
          of {filteredEntries.length.toLocaleString()} entries
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
          <h1 className="text-2xl font-semibold text-slate-900">Bank Data</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage incoming lead entries from campaigns and forms in one operational table.
          </p>
        </div>
      </header>

      <BankDataSummaryCards summary={summary} />

      <BankDataFiltersSection
        filters={filters}
        onSearchChange={(value) => updateFilter('search', value)}
        onSourceChange={(value) => updateFilter('source', value)}
        onStatusChange={(value) => updateFilter('status', value)}
        onReset={resetFilters}
      />

      {isLoading ? (
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
          Loading bank data...
        </div>
      ) : filteredEntries.length === 0 ? (
        <BankDataEmptyState onReset={resetFilters} />
      ) : (
        <BankDataTable
          entries={paginatedEntries}
          allowMutations={allowBankDataMutations}
          onView={onViewEntry}
          onProcess={async (entry) => {
            await processEntry(entry.id);
          }}
          onArchive={async (entry) => {
            await archiveEntry(entry.id);
          }}
          footer={paginationFooter}
        />
      )}

      <BankDataEntryDetailModal
        open={Boolean(selectedEntry)}
        entry={selectedEntry}
        allowMutations={allowBankDataMutations}
        onClose={() => setSelectedEntry(undefined)}
        onProcess={async (entry) => {
          await processEntry(entry.id);
          setSelectedEntry((prev) => (prev ? { ...prev, status: 'Processed' } : prev));
        }}
        onArchive={async (entry) => {
          await archiveEntry(entry.id);
          setSelectedEntry((prev) => (prev ? { ...prev, status: 'Archived' } : prev));
        }}
      />
    </div>
  );
};
