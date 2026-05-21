import { useCallback, useEffect, useState } from 'react';
import { getMeoDashboard } from '../services/meo-dashboard-api';
import type { MeoDashboardData } from '../types/meo-dashboard.types';
import type { DashboardFiltersQuery } from '../types/dashboard-filters.types';

export const useMeoDashboard = (filters: DashboardFiltersQuery) => {
  const [data, setData] = useState<MeoDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getMeoDashboard(filters);
      setData(next);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Gagal memuat dashboard MEO.');
    } finally {
      setLoading(false);
    }
  }, [filters.period, filters.comparison, filters.from, filters.to, filters.serviceId, filters.departmentId]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
};
