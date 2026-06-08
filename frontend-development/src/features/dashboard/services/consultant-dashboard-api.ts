import { apiGet } from '../../../services/api-client';
import type {
  ConsultantDashboardData,
  ConsultantDashboardFiltersQuery
} from '../types/consultant-dashboard.types';
import { buildDashboardQuery } from './dashboard-api-utils';

export const getConsultantDashboard = async (
  filters: ConsultantDashboardFiltersQuery = {}
): Promise<ConsultantDashboardData> => {
  const res = await apiGet<{ success: boolean; data: ConsultantDashboardData }>(
    `/dashboard/consultant${buildDashboardQuery(filters)}`
  );
  return res.data;
};
