import { useCallback, useEffect, useState } from 'react';
import { getCooDashboard } from '../services/coo-dashboard-api';
import type { CooDashboardData, CooDashboardFiltersQuery } from '../types/coo-dashboard.types';

export const useCooDashboard = (filters: CooDashboardFiltersQuery) => {
  const [data, setData] = useState<CooDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getCooDashboard(filters);
      setData(next);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Gagal memuat dashboard COO.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.period, filters.comparison, filters.from, filters.to, filters.serviceId, filters.departmentId]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
};
