import type { ReactNode } from 'react';
import type { DashboardComparison, DashboardFiltersQuery, DashboardPeriod } from '../types/dashboard-filters.types';

interface DashboardFiltersProps {
  filters: DashboardFiltersQuery;
  services: Array<{ service_id: number; name: string }>;
  departments: Array<{ department_id: number; name: string }>;
  onChange: (next: DashboardFiltersQuery) => void;
  layout?: 'panel' | 'inline';
}

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'this_month', label: 'Bulan ini' },
  { value: 'last_month', label: 'Bulan lalu' },
  { value: 'this_year', label: 'Tahun ini' },
  { value: 'last_year', label: 'Tahun lalu' },
  { value: 'custom', label: 'Kustom' }
];

const comparisonOptions: Array<{ value: DashboardComparison; label: string }> = [
  { value: 'prev_month', label: 'vs bulan lalu' },
  { value: 'prev_year', label: 'vs tahun lalu' }
];

const controlClass =
  'h-8 w-full min-w-0 rounded-md border border-[#e4e7ec] bg-white px-2 text-xs text-[#191c1e] transition-colors hover:border-[#c5cdd8] focus:border-[#003c90] focus:outline-none focus:ring-1 focus:ring-[#003c90]/20';

interface FilterFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

const FilterField = ({ label, children, className = '' }: FilterFieldProps) => (
  <label className={`flex min-w-[7.25rem] flex-col gap-0.5 ${className}`}>
    <span className="text-[10px] font-medium text-[#737784]">{label}</span>
    {children}
  </label>
);

const FilterFields = ({
  filters,
  services,
  departments,
  onChange
}: Omit<DashboardFiltersProps, 'layout'>) => (
  <>
    <FilterField label="Periode" className="min-w-[6.5rem] sm:min-w-[7.25rem]">
      <select
        className={controlClass}
        value={filters.period ?? 'this_month'}
        onChange={(e) => onChange({ ...filters, period: e.target.value as DashboardPeriod })}
      >
        {periodOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FilterField>

    <FilterField label="Bandingkan" className="min-w-[7.5rem] sm:min-w-[8.25rem]">
      <select
        className={controlClass}
        value={filters.comparison ?? 'prev_month'}
        onChange={(e) => onChange({ ...filters, comparison: e.target.value as DashboardComparison })}
      >
        {comparisonOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FilterField>

    {filters.period === 'custom' ? (
      <>
        <FilterField label="Dari" className="min-w-[8.5rem]">
          <input
            type="date"
            className={controlClass}
            value={filters.from ?? ''}
            onChange={(e) => onChange({ ...filters, from: e.target.value })}
          />
        </FilterField>
        <FilterField label="Sampai" className="min-w-[8.5rem]">
          <input
            type="date"
            className={controlClass}
            value={filters.to ?? ''}
            onChange={(e) => onChange({ ...filters, to: e.target.value })}
          />
        </FilterField>
      </>
    ) : null}

    <span className="hidden h-6 w-px shrink-0 self-center bg-[#e4e7ec] sm:block" aria-hidden />

    <FilterField label="Service" className="min-w-[6.5rem] sm:min-w-[7.5rem]">
      <select
        className={controlClass}
        value={filters.serviceId ?? ''}
        onChange={(e) => onChange({ ...filters, serviceId: e.target.value || undefined })}
      >
        <option value="">Semua</option>
        {services.map((s) => (
          <option key={s.service_id} value={String(s.service_id)}>
            {s.name}
          </option>
        ))}
      </select>
    </FilterField>

    <FilterField label="Department" className="min-w-[6.5rem] sm:min-w-[7.5rem]">
      <select
        className={controlClass}
        value={filters.departmentId ?? ''}
        onChange={(e) => onChange({ ...filters, departmentId: e.target.value || undefined })}
      >
        <option value="">Semua</option>
        {departments.map((d) => (
          <option key={d.department_id} value={String(d.department_id)}>
            {d.name}
          </option>
        ))}
      </select>
    </FilterField>
  </>
);

const filterBarClass =
  'flex flex-wrap items-end gap-x-2.5 gap-y-2 sm:gap-x-3';

export const DashboardFilters = ({ layout = 'panel', ...props }: DashboardFiltersProps) => {
  if (layout === 'inline') {
    return (
      <div className={`${filterBarClass} w-full lg:justify-end`}>
        <FilterFields {...props} />
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-[#eceef0] bg-white py-2.5 px-2.5 shadow-sm"
      role="toolbar"
      aria-label="Filter dashboard"
    >
      <div className={`${filterBarClass} max-w-full`}>
        <FilterFields {...props} />
      </div>
    </div>
  );
};
