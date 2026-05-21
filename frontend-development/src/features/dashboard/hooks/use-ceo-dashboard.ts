import { useCallback, useEffect, useState } from 'react';
import { getCeoDashboard } from '../services/ceo-dashboard-api';
import type { CeoDashboardData, CeoDashboardFiltersQuery } from '../types/ceo-dashboard.types';

export const useCeoDashboard = (filters: CeoDashboardFiltersQuery) => {
  const [data, setData] = useState<CeoDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getCeoDashboard(filters);
      setData(next);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Gagal memuat dashboard CEO.');
    } finally {
      setLoading(false);
    }
  }, [filters.period, filters.comparison, filters.from, filters.to, filters.serviceId, filters.departmentId]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
};
