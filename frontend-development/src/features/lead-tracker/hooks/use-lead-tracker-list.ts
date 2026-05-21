import { useCallback, useEffect, useState } from 'react';
import { leadTrackerService } from '../services/lead-tracker-service';
import type {
  CreateManualLeadPayload,
  LeadTrackerItem,
  LeadTrackerListMeta,
  LeadTrackerSummary,
  LeadTrackerSummaryMetric,
  LeadTrackerSummaryProcessedByTarget,
  MarkLeadLostPayload
} from '../types/lead-tracker.types';

const emptyMetric = (): LeadTrackerSummaryMetric => ({
  value: 0,
  previous: 0,
  delta: { value: 0, direction: 'flat' }
});

const emptySummary: LeadTrackerSummary = {
  totalLeads: emptyMetric(),
  activeLeads: { value: 0 },
  wonLeads: emptyMetric(),
  lostLeads: emptyMetric()
};

export const useLeadTrackerList = () => {
  const [items, setItems] = useState<LeadTrackerItem[]>([]);
  const [summary, setSummary] = useState<LeadTrackerSummary>(emptySummary);
  const [meta, setMeta] = useState<LeadTrackerListMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchItems = useCallback(
    async (options?: {
      silent?: boolean;
      summaryOnly?: boolean;
      summaryProcessedBy?: LeadTrackerSummaryProcessedByTarget;
    }) => {
      if (!options?.silent && !options?.summaryOnly) {
        setIsLoading(true);
      }
      if (!options?.summaryOnly) {
        setLoadError(null);
      }
      try {
        const data = await leadTrackerService.getList(
          'this_month',
          options?.summaryProcessedBy ?? null
        );
        if (!options?.summaryOnly) {
          setItems(data.items);
        }
        setSummary(data.summary);
        setMeta(data.meta);
      } catch (e) {
        if (!options?.summaryOnly) {
          setItems([]);
          setMeta(null);
          setLoadError(e instanceof Error ? e.message : 'Gagal memuat Lead Tracker.');
        }
        setSummary(emptySummary);
      } finally {
        if (!options?.silent && !options?.summaryOnly) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  const refetchSummary = useCallback(
    (summaryProcessedBy: LeadTrackerSummaryProcessedByTarget) =>
      fetchItems({ silent: true, summaryOnly: true, summaryProcessedBy }),
    [fetchItems]
  );

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

  return {
    items,
    isLoading,
    loadError,
    summary,
    meta,
    refetch: fetchItems,
    refetchSummary,
    createManualLead,
    markLeadLost
  };
};
