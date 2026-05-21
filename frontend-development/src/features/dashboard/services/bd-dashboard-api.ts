import { apiGet } from '../../../services/api-client';
import type { BdDashboardData } from '../types/bd-dashboard.types';
import type { DashboardFiltersQuery } from '../types/dashboard-filters.types';
import { buildDashboardQuery } from './dashboard-api-utils';

export const getBdDashboard = async (filters: DashboardFiltersQuery = {}): Promise<BdDashboardData> => {
  const res = await apiGet<{ success: boolean; data: BdDashboardData }>(`/dashboard/bd${buildDashboardQuery(filters)}`);
  return res.data;
};
