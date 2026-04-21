import { useCallback, useEffect, useMemo, useState } from 'react';
import { handoverService } from '../services/handover-service';
import type { HandoverItem } from '../types/handover.types';

export const useHandoverList = () => {
  const [items, setItems] = useState<HandoverItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    const data = await handoverService.getAll();
    setItems(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const summary = useMemo(() => {
    const totalHandover = items.length;
    const totalDraft = items.filter((item) => item.status === 'Draft').length;
    const totalSubmitted = items.filter((item) => item.status === 'Submitted').length;

    return {
      totalHandover,
      totalDraft,
      totalSubmitted
    };
  }, [items]);

  return {
    items,
    isLoading,
    summary
  };
};
