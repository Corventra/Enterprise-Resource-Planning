import { Filter, Search } from 'lucide-react';
import {
  leadStageLabelMap,
  leadStatusLabelMap,
  type LeadPipelineStatus,
  type LeadStage,
  type LeadTrackerFilters
} from '../../types/lead-tracker.types';

interface LeadTrackerFiltersProps {
  filters: LeadTrackerFilters;
  onSearchChange: (value: string) => void;
  onStageChange: (value: LeadStage | 'All') => void;
  onStatusChange: (value: LeadPipelineStatus | 'All') => void;
  onReset: () => void;
}

const fieldFocus = 'focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';
const selectClassName = `rounded-lg border-none bg-white py-2 pl-3 pr-8 text-xs font-semibold text-[#434653] shadow-sm ${fieldFocus}`;

export const LeadTrackerFiltersSection = ({
  filters,
  onSearchChange,
  onStageChange,
  onStatusChange,
  onReset
}: LeadTrackerFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-[#f2f4f6] p-4">
      <div className="relative min-w-[260px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737784]" />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onSearchChange(event.target.value)}
          className={`w-full rounded-lg border-none bg-white py-2 pl-10 pr-3 text-sm text-[#191c1e] shadow-sm placeholder:text-[#737784]/80 ${fieldFocus}`}
          placeholder="Search company, PIC, email..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.stage}
          onChange={(event) => onStageChange(event.target.value as LeadStage | 'All')}
          className={selectClassName}
          aria-label="Filter by stage"
        >
          <option value="All">All Stages</option>
          <option value="MEETING">{leadStageLabelMap.MEETING}</option>
          <option value="MINUTES">{leadStageLabelMap.MINUTES}</option>
          <option value="PROPOSAL">{leadStageLabelMap.PROPOSAL}</option>
          <option value="ENGAGEMENT_LETTER">{leadStageLabelMap.ENGAGEMENT_LETTER}</option>
        </select>

        <select
          value={filters.status}
          onChange={(event) => onStatusChange(event.target.value as LeadPipelineStatus | 'All')}
          className={selectClassName}
          aria-label="Filter by lead status"
        >
          <option value="All">All Statuses</option>
          <option value="ACTIVE">{leadStatusLabelMap.ACTIVE}</option>
          <option value="LOST">{leadStatusLabelMap.LOST}</option>
          <option value="WON">{leadStatusLabelMap.WON}</option>
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
