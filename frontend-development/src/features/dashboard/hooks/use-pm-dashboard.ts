import { useCallback, useEffect, useState } from 'react';
import { getPmDashboard } from '../services/pm-dashboard-api';
import type { PmDashboardData, PmDashboardFiltersQuery } from '../types/pm-dashboard.types';

export const usePmDashboard = (filters: PmDashboardFiltersQuery) => {
  const [data, setData] = useState<PmDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getPmDashboard(filters);
      setData(next);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Gagal memuat dashboard PM.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.period, filters.comparison, filters.from, filters.to]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
};
