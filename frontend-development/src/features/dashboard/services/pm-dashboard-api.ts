import { apiGet } from '../../../services/api-client';
import type { PmDashboardData, PmDashboardFiltersQuery } from '../types/pm-dashboard.types';
import { buildDashboardQuery } from './dashboard-api-utils';

export const getPmDashboard = async (filters: PmDashboardFiltersQuery = {}): Promise<PmDashboardData> => {
  const res = await apiGet<{ success: boolean; data: PmDashboardData }>(
    `/dashboard/pm${buildDashboardQuery(filters)}`
  );
  return res.data;
};
