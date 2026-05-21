import { useCallback, useEffect, useState } from 'react';
import { meetingsService } from '../services/meetings-service';
import type {
  MeetingMonitorItem,
  MeetingMonitorMeta,
  MeetingMonitorSummary,
  MeetingSummaryHandledByTarget
} from '../types/meetings.types';

export const useMeetingsList = () => {
  const [items, setItems] = useState<MeetingMonitorItem[]>([]);
  const [summary, setSummary] = useState<MeetingMonitorSummary>({
    totalMeeting: { value: 0 },
    today: { value: 0 },
    upcoming: { value: 0 },
    completed: { value: 0 },
    noMinutes: { value: 0 }
  });
  const [meta, setMeta] = useState<MeetingMonitorMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async (summaryHandledByTarget: MeetingSummaryHandledByTarget = null) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await meetingsService.getList(summaryHandledByTarget);
      setItems(data.items);
      setSummary(data.summary);
      setMeta(data.meta);
    } catch {
      setLoadError('Gagal memuat daftar meeting.');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(null);
  }, [load]);

  const refetchSummary = useCallback(
    async (summaryHandledByTarget: MeetingSummaryHandledByTarget) => {
      try {
        const data = await meetingsService.getList(summaryHandledByTarget);
        setSummary(data.summary);
        setMeta(data.meta);
        if (summaryHandledByTarget == null) {
          setItems(data.items);
        }
      } catch {
        setLoadError('Gagal memuat ringkasan meeting.');
      }
    },
    []
  );

  const completeMeeting = useCallback(
    async (leadId: string, meetingId: string, summaryHandledByTarget: MeetingSummaryHandledByTarget = null) => {
      await meetingsService.completeMeeting(leadId, meetingId);
      await load(summaryHandledByTarget);
    },
    [load]
  );

  return {
    items,
    summary,
    meta,
    isLoading,
    loadError,
    refetchSummary,
    completeMeeting,
    reload: load
  };
};
