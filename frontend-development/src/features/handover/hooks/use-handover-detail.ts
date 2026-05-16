import { useCallback, useEffect, useState } from 'react';
import { handoverService } from '../services/handover-service';
import type { HandoverDetail } from '../types/handover.types';

export const useHandoverDetail = (handoverId?: string) => {
  const [detail, setDetail] = useState<HandoverDetail | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!handoverId) {
      setDetail(undefined);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await handoverService.getById(handoverId);
      setDetail(data);
      if (!data) {
        setError('Handover tidak ditemukan.');
      }
    } catch (e) {
      setDetail(undefined);
      setError(e instanceof Error ? e.message : 'Gagal memuat detail handover.');
    } finally {
      setIsLoading(false);
    }
  }, [handoverId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  return {
    detail,
    error,
    isLoading,
    refetch: fetchDetail
  };
};
