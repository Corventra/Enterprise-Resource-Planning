import { apiGet } from '../../../services/api-client';
import type { DashboardFiltersQuery } from '../types/dashboard-filters.types';
import type { StaffAdminDashboardData } from '../types/staff-admin-dashboard.types';
import { buildDashboardQuery } from './dashboard-api-utils';

export const getStaffAdminDashboard = async (
  filters: DashboardFiltersQuery = {}
): Promise<StaffAdminDashboardData> => {
  const res = await apiGet<{ success: boolean; data: StaffAdminDashboardData }>(
    `/dashboard/staff-admin${buildDashboardQuery(filters)}`
  );
  return res.data;
};
