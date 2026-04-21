import { useCallback, useEffect, useState } from 'react';
import { handoverService } from '../services/handover-service';
import type { HandoverDetail } from '../types/handover.types';

export const useHandoverDetail = (handoverId?: string) => {
  const [detail, setDetail] = useState<HandoverDetail | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!handoverId) {
      setDetail(undefined);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const data = await handoverService.getById(handoverId);
    setDetail(data);
    setIsLoading(false);
  }, [handoverId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  return {
    detail,
    isLoading
  };
};
