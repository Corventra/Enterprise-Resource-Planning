import { Filter, Search } from 'lucide-react';
import {
  PROJECT_STATUS_OPTIONS,
  type ProjectFilters,
  type ProjectServiceLine,
  type ProjectStatus
} from '../../types/project.types';

interface ProjectFiltersProps {
  filters: ProjectFilters;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ProjectStatus | 'All') => void;
  onServiceLineChange: (value: ProjectServiceLine | 'All') => void;
  onReset: () => void;
}

const fieldFocus = 'focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';
const selectClassName = `rounded-lg border-none bg-white py-2 pl-3 pr-8 text-sm font-medium text-[#434653] shadow-sm ${fieldFocus}`;

export const ProjectFiltersSection = ({
  filters,
  onSearchChange,
  onStatusChange,
  onServiceLineChange,
  onReset
}: ProjectFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[#eceef0] p-4">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737784]" />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onSearchChange(event.target.value)}
          className={`w-full rounded-lg border-none bg-white py-2 pl-10 pr-3 text-sm text-[#191c1e] shadow-sm placeholder:text-[#737784]/80 ${fieldFocus}`}
          placeholder="Search project code, client, project name..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.serviceLine}
          onChange={(event) => onServiceLineChange(event.target.value as ProjectServiceLine | 'All')}
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
          value={filters.status}
          onChange={(event) => onStatusChange(event.target.value as ProjectStatus | 'All')}
          className={selectClassName}
          aria-label="Filter by project status"
        >
          <option value="All">All Status</option>
          {PROJECT_STATUS_OPTIONS.map((status) => (
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
