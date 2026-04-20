import { Filter, Search } from 'lucide-react';
import {
  leadStageLabelMap,
  type LeadStage,
  type LeadTrackerFilters,
  type LeadTrackerStatus
} from '../../types/lead-tracker.types';

interface LeadTrackerFiltersProps {
  filters: LeadTrackerFilters;
  onSearchChange: (value: string) => void;
  onStageChange: (value: LeadStage | 'All') => void;
  onStatusChange: (value: LeadTrackerStatus | 'All') => void;
  onReset: () => void;
}

const fieldFocus = 'focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';
const selectClassName = `rounded-lg border-none bg-white py-2 pl-3 pr-8 text-sm font-medium text-[#434653] shadow-sm ${fieldFocus}`;

export const LeadTrackerFiltersSection = ({
  filters,
  onSearchChange,
  onStageChange,
  onStatusChange,
  onReset
}: LeadTrackerFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[#eceef0] p-4">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737784]" />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onSearchChange(event.target.value)}
          className={`w-full rounded-lg border-none bg-white py-2 pl-10 pr-3 text-sm text-[#191c1e] shadow-sm placeholder:text-[#737784]/80 ${fieldFocus}`}
          placeholder="Search company, owner, next action..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.stage}
          onChange={(event) => onStageChange(event.target.value as LeadStage | 'All')}
          className={selectClassName}
          aria-label="Filter by stage"
        >
          <option value="All">All Stages</option>
          <option value="MEETING">{leadStageLabelMap.MEETING}</option>
          <option value="NOTULENSI">{leadStageLabelMap.NOTULENSI}</option>
          <option value="PROPOSAL">{leadStageLabelMap.PROPOSAL}</option>
          <option value="ENGAGEMENT_LETTER">{leadStageLabelMap.ENGAGEMENT_LETTER}</option>
        </select>

        <select
          value={filters.status}
          onChange={(event) => onStatusChange(event.target.value as LeadTrackerStatus | 'All')}
          className={selectClassName}
          aria-label="Filter by status"
        >
          <option value="All">All Statuses</option>
          <option value="Need Follow Up">Need Follow Up</option>
          <option value="Need Revision">Need Revision</option>
          <option value="Ready for Handover">Ready for Handover</option>
          <option value="On Track">On Track</option>
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
