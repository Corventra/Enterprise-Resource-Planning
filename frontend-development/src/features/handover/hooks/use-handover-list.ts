import { useCallback, useEffect, useMemo, useState } from 'react';
import { handoverService } from '../services/handover-service';
import type { HandoverItem } from '../types/handover.types';

export const useHandoverList = () => {
  const [items, setItems] = useState<HandoverItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await handoverService.getAll();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const summary = useMemo(() => {
    const totalHandover = items.length;
    const totalDraft = items.filter(
      (item) => item.status === 'Draft' || item.status === 'Revision Needed'
    ).length;
    const totalAwaitingApproval = items.filter((item) => item.status === 'Waiting CEO Approval').length;
    const totalActive = items.filter((item) =>
      ['Approved', 'Routed to COO', 'Assigned to PM'].includes(item.status)
    ).length;

    return {
      totalHandover,
      totalDraft,
      totalAwaitingApproval,
      totalActive
    };
  }, [items]);

  return {
    items,
    isLoading,
    summary
  };
};
