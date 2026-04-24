import { Filter, Search } from 'lucide-react';
import type {
  HandoverEngagementStatus,
  HandoverFilters,
  HandoverItem,
  HandoverStatus
} from '../../types/handover.types';

interface HandoverFiltersProps {
  filters: HandoverFilters;
  onSearchChange: (value: string) => void;
  onServiceLineChange: (value: HandoverItem['serviceLine'] | 'All') => void;
  onEngagementStatusChange: (value: HandoverEngagementStatus | 'All') => void;
  onStatusChange: (value: HandoverStatus | 'All') => void;
  onReset: () => void;
}

const fieldFocus = 'focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';
const selectClassName = `rounded-lg border-none bg-white py-2 pl-3 pr-8 text-xs font-semibold text-[#434653] shadow-sm ${fieldFocus}`;

export const HandoverFiltersSection = ({
  filters,
  onSearchChange,
  onServiceLineChange,
  onEngagementStatusChange,
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
          placeholder="Search doc code, client, project..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.serviceLine}
          onChange={(event) => onServiceLineChange(event.target.value as HandoverItem['serviceLine'] | 'All')}
          className={selectClassName}
          aria-label="Filter by service line"
        >
          <option value="All">All Service Lines</option>
          <option value="Transfer Pricing">Transfer Pricing</option>
          <option value="Tax">Tax</option>
          <option value="Advisory">Advisory</option>
          <option value="Audit">Audit</option>
        </select>

        <select
          value={filters.engagementStatus}
          onChange={(event) => onEngagementStatusChange(event.target.value as HandoverEngagementStatus | 'All')}
          className={selectClassName}
          aria-label="Filter by engagement status"
        >
          <option value="All">All Engagement Status</option>
          <option value="Signed">Signed</option>
          <option value="Pending">Pending</option>
        </select>

        <select
          value={filters.status}
          onChange={(event) => onStatusChange(event.target.value as HandoverStatus | 'All')}
          className={selectClassName}
          aria-label="Filter by handover status"
        >
          <option value="All">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
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
