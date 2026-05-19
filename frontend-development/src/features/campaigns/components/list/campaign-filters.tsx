import { Filter, Search } from 'lucide-react';
import type { CampaignApiStatus, CampaignFilters } from '../../types/campaign.types';

interface CampaignFiltersProps {
  filters: CampaignFilters;
  typeFilterOptions: string[];
  createdByFilterOptions: string[];
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: CampaignApiStatus | 'All') => void;
  onCreatedByChange: (value: string) => void;
  onReset: () => void;
}

const fieldFocus = 'focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';

const selectClassName = `rounded-lg border-none bg-white py-2 pl-3 pr-8 text-xs font-semibold text-[#434653] shadow-sm ${fieldFocus}`;

export const CampaignFiltersSection = ({
  filters,
  typeFilterOptions,
  createdByFilterOptions,
  onSearchChange,
  onTypeChange,
  onStatusChange,
  onCreatedByChange,
  onReset
}: CampaignFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-[#f2f4f6] p-4">
      <div className="relative min-w-[260px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737784]" />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onSearchChange(event.target.value)}
          className={`w-full rounded-lg border-none bg-white py-2 pl-10 pr-3 text-sm text-[#191c1e] shadow-sm placeholder:text-[#737784]/80 ${fieldFocus}`}
          placeholder="Search by name, topic, or code..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.type}
          onChange={(event) => onTypeChange(event.target.value)}
          className={selectClassName}
          aria-label="Filter by type"
        >
          {typeFilterOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === 'All' ? 'All types' : opt}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(event) => onStatusChange(event.target.value as CampaignApiStatus | 'All')}
          className={selectClassName}
          aria-label="Filter by status"
        >
          <option value="All">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
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
