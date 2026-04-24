import { Filter, Search } from 'lucide-react';
import type { BankDataFilters, BankDataSource, BankDataStatus } from '../../types/bank-data.types';

interface BankDataFiltersProps {
  filters: BankDataFilters;
  onSearchChange: (value: string) => void;
  onSourceChange: (value: BankDataSource | 'All') => void;
  onStatusChange: (value: BankDataStatus | 'All') => void;
  onReset: () => void;
}

const fieldFocus = 'focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';
const selectClassName = `rounded-lg border-none bg-white py-2 pl-3 pr-8 text-xs font-semibold text-[#434653] shadow-sm ${fieldFocus}`;

export const BankDataFiltersSection = ({
  filters,
  onSearchChange,
  onSourceChange,
  onStatusChange,
  onReset
}: BankDataFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-[#f2f4f6] p-4">
      <div className="relative min-w-[260px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737784]" />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onSearchChange(event.target.value)}
          className={`w-full rounded-lg border-none bg-white py-2 pl-10 pr-3 text-sm text-[#191c1e] shadow-sm placeholder:text-[#737784]/80 ${fieldFocus}`}
          placeholder="Search company, contact, campaign..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.source}
          onChange={(event) => onSourceChange(event.target.value as BankDataSource | 'All')}
          className={selectClassName}
          aria-label="Filter by source"
        >
          <option value="All">All Sources</option>
          <option value="Website">Website</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Instagram">Instagram</option>
          <option value="Email">Email</option>
          <option value="WhatsApp">WhatsApp</option>
        </select>

        <select
          value={filters.status}
          onChange={(event) => onStatusChange(event.target.value as BankDataStatus | 'All')}
          className={selectClassName}
          aria-label="Filter by status"
        >
          <option value="All">All Statuses</option>
          <option value="New">New</option>
          <option value="Processed">Processed</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onReset}
        title="Reset filters"
        aria-label="Reset filters"
        className="rounded-lg bg-white p-2 text-[#737784] shadow-sm transition-colors hover:text-[#003c90]"
      >
        <Filter className="h-4 w-4" />
      </button>
    </div>
  );
};
