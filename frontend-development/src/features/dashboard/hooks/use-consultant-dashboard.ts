import { useCallback, useEffect, useState } from 'react';
import { getConsultantDashboard } from '../services/consultant-dashboard-api';
import type {
  ConsultantDashboardData,
  ConsultantDashboardFiltersQuery
} from '../types/consultant-dashboard.types';

export const useConsultantDashboard = (filters: ConsultantDashboardFiltersQuery) => {
  const [data, setData] = useState<ConsultantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getConsultantDashboard(filters);
      setData(next);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Gagal memuat dashboard Consultant.');
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
