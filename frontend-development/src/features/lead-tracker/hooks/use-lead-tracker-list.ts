import { useCallback, useEffect, useMemo, useState } from 'react';
import { leadTrackerService } from '../services/lead-tracker-service';
import type { CreateManualLeadPayload, LeadTrackerItem, MarkLeadLostPayload } from '../types/lead-tracker.types';

export const useLeadTrackerList = () => {
  const [items, setItems] = useState<LeadTrackerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchItems = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true);
    }
    setLoadError(null);
    try {
      const data = await leadTrackerService.getAll();
      setItems(data);
    } catch (e) {
      setItems([]);
      setLoadError(e instanceof Error ? e.message : 'Gagal memuat Lead Tracker.');
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const createManualLead = async (payload: CreateManualLeadPayload) => {
    await leadTrackerService.createManual(payload);
    await fetchItems({ silent: true });
  };

  const markLeadLost = async (leadId: string, payload: MarkLeadLostPayload) => {
    await leadTrackerService.markLost(leadId, payload);
    await fetchItems({ silent: true });
  };

  const summary = useMemo(() => {
    const totalLeads = items.length;
    const activeLeads = items.filter((item) => item.leadStatus === 'ACTIVE').length;
    const wonLeads = items.filter((item) => item.leadStatus === 'WON').length;
    const lostLeads = items.filter((item) => item.leadStatus === 'LOST').length;

    return {
      totalLeads,
      activeLeads,
      wonLeads,
      lostLeads
    };
  }, [items]);

  return {
    items,
    isLoading,
    loadError,
    summary,
    refetch: fetchItems,
    createManualLead,
    markLeadLost
  };
};
