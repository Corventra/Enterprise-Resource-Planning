export type DashboardPeriod = 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';
export type DashboardComparison = 'prev_month' | 'prev_year';

export interface DashboardFiltersQuery {
  period?: DashboardPeriod;
  comparison?: DashboardComparison;
  from?: string;
  to?: string;
  serviceId?: string;
  departmentId?: string;
}
