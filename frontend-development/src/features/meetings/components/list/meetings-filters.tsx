import { Filter, Search } from 'lucide-react';
import type { MeetingMonitorFilters } from '../../types/meetings.types';

interface MeetingsFiltersSectionProps {
  filters: MeetingMonitorFilters;
  handledByFilterOptions: string[];
  showHandledByFilter: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: MeetingMonitorFilters['status']) => void;
  onModeChange: (value: MeetingMonitorFilters['mode']) => void;
  onMinutesChange: (value: MeetingMonitorFilters['minutes']) => void;
  onHandledByChange: (value: string) => void;
  onReset: () => void;
}

const fieldFocus = 'focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';
const selectClassName = `rounded-lg border-none bg-white py-2 pl-3 pr-8 text-xs font-semibold text-[#434653] shadow-sm ${fieldFocus}`;

export const MeetingsFiltersSection = ({
  filters,
  handledByFilterOptions,
  showHandledByFilter,
  onSearchChange,
  onStatusChange,
  onModeChange,
  onMinutesChange,
  onHandledByChange,
  onReset
}: MeetingsFiltersSectionProps) => (
  <div className="flex flex-col gap-3 rounded-xl bg-[#f2f4f6] p-4 lg:flex-row lg:flex-wrap lg:items-center">
    <div className="relative min-w-[240px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737784]" />
      <input
        type="search"
        value={filters.search}
        onChange={(event) => onSearchChange(event.target.value)}
        className={`w-full rounded-lg border-none bg-white py-2 pl-10 pr-3 text-sm text-[#191c1e] shadow-sm placeholder:text-[#737784]/80 ${fieldFocus}`}
        placeholder="Cari perusahaan, PIC, atau agenda..."
      />
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filters.status}
        onChange={(event) => onStatusChange(event.target.value as MeetingMonitorFilters['status'])}
        className={selectClassName}
        aria-label="Filter status meeting"
      >
        <option value="All">Semua Status</option>
        <option value="SCHEDULED">Scheduled</option>
        <option value="DONE">Done</option>
        <option value="CANCELLED">Cancelled</option>
      </select>

      <select
        value={filters.mode}
        onChange={(event) => onModeChange(event.target.value as MeetingMonitorFilters['mode'])}
        className={selectClassName}
        aria-label="Filter mode meeting"
      >
        <option value="All">Semua Mode</option>
        <option value="ONLINE">Online</option>
        <option value="OFFLINE">Offline</option>
      </select>

      <select
        value={filters.minutes}
        onChange={(event) => onMinutesChange(event.target.value as MeetingMonitorFilters['minutes'])}
        className={selectClassName}
        aria-label="Filter status minutes"
      >
        <option value="All">Semua Minutes</option>
        <option value="HAS_MINUTES">Done</option>
        <option value="NO_MINUTES">Not Created</option>
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
