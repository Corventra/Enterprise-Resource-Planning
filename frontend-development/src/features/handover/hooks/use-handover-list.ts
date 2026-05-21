import { useCallback, useEffect, useState } from 'react';
import { handoverService } from '../services/handover-service';
import type {
  HandoverItem,
  HandoverListMeta,
  HandoverSummary,
  HandoverSummaryCreatedByTarget
} from '../types/handover.types';

const emptySummary: HandoverSummary = {
  totalHandover: { value: 0 },
  totalDraft: { value: 0 },
  totalAwaitingApproval: { value: 0 },
  totalActive: { value: 0 }
};

export const useHandoverList = () => {
  const [items, setItems] = useState<HandoverItem[]>([]);
  const [summary, setSummary] = useState<HandoverSummary>(emptySummary);
  const [meta, setMeta] = useState<HandoverListMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(
    async (options?: {
      silent?: boolean;
      summaryOnly?: boolean;
      summaryCreatedBy?: HandoverSummaryCreatedByTarget;
    }) => {
      if (!options?.silent && !options?.summaryOnly) {
        setIsLoading(true);
      }
      try {
        const data = await handoverService.getList(options?.summaryCreatedBy ?? null);
        if (!options?.summaryOnly) {
          setItems(data.items);
        }
        setSummary(data.summary);
        setMeta(data.meta);
      } catch {
        if (!options?.summaryOnly) {
          setItems([]);
          setMeta(null);
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
    (summaryCreatedBy: HandoverSummaryCreatedByTarget) =>
      fetchItems({ silent: true, summaryOnly: true, summaryCreatedBy }),
    [fetchItems]
  );

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  return {
    items,
    isLoading,
    summary,
    meta,
    refetch: fetchItems,
    refetchSummary
  };
};
