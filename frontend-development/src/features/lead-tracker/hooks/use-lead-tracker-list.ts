import { useCallback, useEffect, useMemo, useState } from 'react';
import { leadTrackerService } from '../services/lead-tracker-service';
import type { LeadTrackerItem } from '../types/lead-tracker.types';

export const useLeadTrackerList = () => {
  const [items, setItems] = useState<LeadTrackerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    const data = await leadTrackerService.getAll();
    setItems(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const summary = useMemo(() => {
    const totalLeads = items.length;
    const needFollowUp = items.filter((item) => item.status === 'Need Follow Up').length;
    const needRevision = items.filter((item) => item.status === 'Need Revision').length;
    const readyForHandover = items.filter((item) => item.status === 'Ready for Handover').length;

    return {
      totalLeads,
      needFollowUp,
      needRevision,
      readyForHandover
    };
  }, [items]);

  return {
    items,
    isLoading,
    summary
  };
};
