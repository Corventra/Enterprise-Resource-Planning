import { useCallback, useEffect, useState } from 'react';
import { getStaffAdminDashboard } from '../services/staff-admin-dashboard-api';
import type { DashboardFiltersQuery } from '../types/dashboard-filters.types';
import type { StaffAdminDashboardData } from '../types/staff-admin-dashboard.types';

export const useStaffAdminDashboard = (filters: DashboardFiltersQuery) => {
  const [data, setData] = useState<StaffAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getStaffAdminDashboard(filters);
      setData(next);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Gagal memuat dashboard Staff Administrasi.');
    } finally {
      setLoading(false);
    }
  }, [filters.period, filters.comparison, filters.from, filters.to, filters.serviceId, filters.departmentId]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
};
