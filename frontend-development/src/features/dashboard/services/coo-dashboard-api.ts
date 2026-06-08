import { apiGet } from '../../../services/api-client';
import type { CooDashboardData, CooDashboardFiltersQuery } from '../types/coo-dashboard.types';
import { buildDashboardQuery } from './dashboard-api-utils';

export const getCooDashboard = async (filters: CooDashboardFiltersQuery = {}): Promise<CooDashboardData> => {
  const res = await apiGet<{ success: boolean; data: CooDashboardData }>(
    `/dashboard/coo${buildDashboardQuery(filters)}`
  );
  return res.data;
};
