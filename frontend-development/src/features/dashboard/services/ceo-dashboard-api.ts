import { apiGet } from '../../../services/api-client';
import type { CeoDashboardData, CeoDashboardFiltersQuery } from '../types/ceo-dashboard.types';
import { buildDashboardQuery } from './dashboard-api-utils';

export const getCeoDashboard = async (filters: CeoDashboardFiltersQuery = {}): Promise<CeoDashboardData> => {
  const res = await apiGet<{ success: boolean; data: CeoDashboardData }>(
    `/dashboard/ceo${buildDashboardQuery(filters)}`
  );
  return res.data;
};
