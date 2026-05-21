import { Filter, Search } from 'lucide-react';
import { documentCenterCategoryFilterOptions } from '../../constants/document-center-categories';
import type { DocumentCenterListFilters } from '../../types/document-center.types';
import { leadStageDisplay } from '../../utils/document-center-display';

interface DocumentCenterListFiltersSectionProps {
  filters: DocumentCenterListFilters;
  stageFilterOptions: string[];
  handledByFilterOptions: string[];
  showHandledByFilter: boolean;
  onSearchChange: (value: string) => void;
  onStageChange: (value: string) => void;
  onHandledByChange: (value: string) => void;
  onCategoryChange: (value: DocumentCenterListFilters['hasCategory']) => void;
  onLastUpdatedChange: (value: DocumentCenterListFilters['lastUpdated']) => void;
  onReset: () => void;
}

const fieldFocus = 'focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';
const selectClassName = `rounded-lg border-none bg-white py-2 pl-3 pr-8 text-xs font-semibold text-[#434653] shadow-sm ${fieldFocus}`;

export const DocumentCenterListFiltersSection = ({
  filters,
  stageFilterOptions,
  handledByFilterOptions,
  showHandledByFilter,
  onSearchChange,
  onStageChange,
  onHandledByChange,
  onCategoryChange,
  onLastUpdatedChange,
  onReset
}: DocumentCenterListFiltersSectionProps) => (
  <div className="flex flex-col gap-3 rounded-xl bg-[#f2f4f6] p-4 lg:flex-row lg:flex-wrap lg:items-center">
    <div className="relative min-w-[240px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737784]" />
      <input
        type="search"
        value={filters.search}
        onChange={(event) => onSearchChange(event.target.value)}
        className={`w-full rounded-lg border-none bg-white py-2 pl-10 pr-3 text-sm text-[#191c1e] shadow-sm placeholder:text-[#737784]/80 ${fieldFocus}`}
        placeholder="Cari perusahaan atau lead code..."
      />
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filters.stage}
        onChange={(event) => onStageChange(event.target.value)}
        className={selectClassName}
        aria-label="Filter stage"
      >
        {stageFilterOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt === 'All' ? 'Semua Stage' : leadStageDisplay(opt)}
          </option>
        ))}
      </select>

      {showHandledByFilter ? (
        <select
          value={filters.handledBy}
          onChange={(event) => onHandledByChange(event.target.value)}
          className={selectClassName}
          aria-label="Filter handled by"
        >
          {handledByFilterOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === 'All' ? 'Semua BD' : opt}
            </option>
          ))}
        </select>
      ) : null}

      <select
        value={filters.hasCategory}
        onChange={(event) => onCategoryChange(event.target.value as DocumentCenterListFilters['hasCategory'])}
        className={selectClassName}
        aria-label="Filter kategori dokumen"
      >
        {documentCenterCategoryFilterOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={filters.lastUpdated}
        onChange={(event) => onLastUpdatedChange(event.target.value as DocumentCenterListFilters['lastUpdated'])}
        className={selectClassName}
        aria-label="Filter terakhir diperbarui"
      >
        <option value="All">Semua Periode</option>
        <option value="7d">7 hari terakhir</option>
        <option value="30d">30 hari terakhir</option>
        <option value="90d">90 hari terakhir</option>
      </select>
    </div>

    <button
      type="button"
      onClick={onReset}
      title="Reset filter"
      aria-label="Reset filter"
      className="self-start rounded-lg bg-white p-2 text-[#737784] shadow-sm transition-colors hover:text-[#003c90] lg:self-center"
    >
      <Filter className="h-4 w-4" />
    </button>
  </div>
);
