import { Filter, Search } from 'lucide-react';
import { HANDOVER_STATUS_OPTIONS, type HandoverFilters, type HandoverStatus } from '../../types/handover.types';

interface HandoverFiltersProps {
  filters: HandoverFilters;
  serviceLineOptions?: string[];
  createdByFilterOptions?: string[];
  onSearchChange: (value: string) => void;
  onServiceLineChange: (value: string) => void;
  onCreatedByChange: (value: string) => void;
  onStatusChange: (value: HandoverStatus | 'All') => void;
  onReset: () => void;
}

const fieldFocus = 'focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';
const selectClassName = `rounded-lg border-none bg-white py-2 pl-3 pr-8 text-xs font-semibold text-[#434653] shadow-sm ${fieldFocus}`;

export const HandoverFiltersSection = ({
  filters,
  serviceLineOptions = [],
  createdByFilterOptions = [],
  onSearchChange,
  onServiceLineChange,
  onCreatedByChange,
  onStatusChange,
  onReset
}: HandoverFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-[#f2f4f6] p-4">
      <div className="relative min-w-[260px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737784]" />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onSearchChange(event.target.value)}
          className={`w-full rounded-lg border-none bg-white py-2 pl-10 pr-3 text-sm text-[#191c1e] shadow-sm placeholder:text-[#737784]/80 ${fieldFocus}`}
          placeholder="Search doc code, client, title..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.serviceLine}
          onChange={(event) => onServiceLineChange(event.target.value)}
          className={selectClassName}
          aria-label="Filter by service"
        >
          <option value="All">All Services</option>
          {serviceLineOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={filters.createdBy}
          onChange={(event) => onCreatedByChange(event.target.value)}
          className={selectClassName}
          aria-label="Filter by created by"
        >
          {createdByFilterOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === 'All' ? 'All creators' : opt}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(event) => onStatusChange(event.target.value as HandoverStatus | 'All')}
          className={selectClassName}
          aria-label="Filter by handover status"
        >
          <option value="All">All Status</option>
          {HANDOVER_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
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
