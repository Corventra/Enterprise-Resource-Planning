import type { CampaignFilters, CampaignStatus, CampaignType, Channel } from '../../types/campaign.types';

interface CampaignFiltersProps {
  filters: CampaignFilters;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: CampaignType | 'All') => void;
  onChannelChange: (value: Channel | 'All') => void;
  onStatusChange: (value: CampaignStatus | 'All') => void;
  onReset: () => void;
}

const selectClassName =
  'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none';

export const CampaignFiltersSection = ({
  filters,
  onSearchChange,
  onTypeChange,
  onChannelChange,
  onStatusChange,
  onReset
}: CampaignFiltersProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
          placeholder="Search by campaign name..."
        />

        <select
          value={filters.type}
          onChange={(event) => onTypeChange(event.target.value as CampaignType | 'All')}
          className={selectClassName}
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
        >
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Active">Active</option>
          <option value="Paused">Paused</option>
          <option value="Completed">Completed</option>
        </select>

        <button
          type="button"
          onClick={onReset}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};
