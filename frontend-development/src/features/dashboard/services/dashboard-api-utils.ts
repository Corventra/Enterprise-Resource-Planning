import type { DashboardFiltersQuery } from '../types/dashboard-filters.types';

export const buildDashboardQuery = (filters: DashboardFiltersQuery) => {
  const params = new URLSearchParams();
  if (filters.period) params.set('period', filters.period);
  if (filters.comparison) params.set('comparison', filters.comparison);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.serviceId) params.set('serviceId', filters.serviceId);
  if (filters.departmentId) params.set('departmentId', filters.departmentId);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};
