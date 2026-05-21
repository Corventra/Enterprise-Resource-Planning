import { useCallback, useEffect, useState } from 'react';
import { getBdDashboard } from '../services/bd-dashboard-api';
import type { BdDashboardData } from '../types/bd-dashboard.types';
import type { DashboardFiltersQuery } from '../types/dashboard-filters.types';

export const useBdDashboard = (filters: DashboardFiltersQuery) => {
  const [data, setData] = useState<BdDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getBdDashboard(filters);
      setData(next);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Gagal memuat dashboard BD.');
    } finally {
      setLoading(false);
    }
  }, [filters.period, filters.comparison, filters.from, filters.to, filters.serviceId, filters.departmentId]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
};
