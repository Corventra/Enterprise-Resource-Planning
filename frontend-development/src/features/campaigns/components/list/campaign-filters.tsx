import { Filter, Search } from 'lucide-react';
import type { CampaignFilters, CampaignStatus, CampaignType, Channel } from '../../types/campaign.types';

interface CampaignFiltersProps {
  filters: CampaignFilters;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: CampaignType | 'All') => void;
  onChannelChange: (value: Channel | 'All') => void;
  onStatusChange: (value: CampaignStatus | 'All') => void;
  onReset: () => void;
}

const fieldFocus = 'focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';

const selectClassName = `rounded-lg border-none bg-white py-2 pl-3 pr-8 text-sm font-medium text-[#434653] shadow-sm ${fieldFocus}`;

export const CampaignFiltersSection = ({
  filters,
  onSearchChange,
  onTypeChange,
  onChannelChange,
  onStatusChange,
  onReset
}: CampaignFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[#eceef0] p-4">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737784]" />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onSearchChange(event.target.value)}
          className={`w-full rounded-lg border-none bg-white py-2 pl-10 pr-3 text-sm text-[#191c1e] shadow-sm placeholder:text-[#737784]/80 ${fieldFocus}`}
          placeholder="Search by name, tag or ID..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.type}
          onChange={(event) => onTypeChange(event.target.value as CampaignType | 'All')}
          className={selectClassName}
          aria-label="Filter by type"
        >
          <option value="All">All Types</option>
          <option value="Acquisition">Acquisition</option>
          <option value="Retention">Retention</option>
          <option value="Awareness">Awareness</option>
        </select>

        <select
          value={filters.channel}
          onChange={(event) => onChannelChange(event.target.value as Channel | 'All')}
          className={selectClassName}
          aria-label="Filter by channel"
        >
          <option value="All">All Channels</option>
          <option value="Email">Email</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Instagram">Instagram</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Website">Website</option>
        </select>

        <select
          value={filters.status}
          onChange={(event) => onStatusChange(event.target.value as CampaignStatus | 'All')}
          className={selectClassName}
          aria-label="Filter by status"
        >
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Active">Active</option>
          <option value="Paused">Paused</option>
          <option value="Completed">Completed</option>
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
