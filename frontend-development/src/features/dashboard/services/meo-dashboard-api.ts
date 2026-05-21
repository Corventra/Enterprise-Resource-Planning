import { apiGet } from '../../../services/api-client';
import type { MeoDashboardData } from '../types/meo-dashboard.types';
import type { DashboardFiltersQuery } from '../types/dashboard-filters.types';
import { buildDashboardQuery } from './dashboard-api-utils';

export const getMeoDashboard = async (filters: DashboardFiltersQuery = {}): Promise<MeoDashboardData> => {
  const res = await apiGet<{ success: boolean; data: MeoDashboardData }>(
    `/dashboard/meo${buildDashboardQuery(filters)}`
  );
  return res.data;
};
