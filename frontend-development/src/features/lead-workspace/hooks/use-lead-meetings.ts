import { useCallback, useEffect, useState } from 'react';
import { leadMeetingsService } from '../services/lead-meetings-service';
import type {
  LeadWorkspaceMeetingListItem,
  LeadWorkspaceMeetingMinutesView,
  SaveMeetingMinutesPayload,
  ScheduleMeetingPayload
} from '../types/lead-meetings.types';

export const useLeadMeetings = (leadId?: string) => {
  const [meetings, setMeetings] = useState<LeadWorkspaceMeetingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async (options?: { silent?: boolean }) => {
    if (!leadId) {
      setMeetings([]);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    if (!options?.silent) {
      setIsLoading(true);
    }
    setLoadError(null);
    try {
      const items = await leadMeetingsService.list(leadId);
      setMeetings(items);
    } catch (e) {
      setMeetings([]);
      setLoadError(e instanceof Error ? e.message : 'Gagal memuat daftar meeting.');
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, [leadId]);

  useEffect(() => {
    void fetchMeetings();
  }, [fetchMeetings]);

  const scheduleMeeting = async (payload: ScheduleMeetingPayload) => {
    if (!leadId) {
      throw new Error('Lead ID tidak tersedia.');
    }
    const meeting = await leadMeetingsService.schedule(leadId, payload);
    await fetchMeetings({ silent: true });
    return meeting;
  };

  const completeMeeting = async (meetingId: string) => {
    if (!leadId) {
      throw new Error('Lead ID tidak tersedia.');
    }
    const meeting = await leadMeetingsService.complete(leadId, meetingId);
    await fetchMeetings({ silent: true });
    return meeting;
  };

  const cancelMeeting = async (meetingId: string) => {
    if (!leadId) {
      throw new Error('Lead ID tidak tersedia.');
    }
    const meeting = await leadMeetingsService.cancel(leadId, meetingId);
    await fetchMeetings({ silent: true });
    return meeting;
  };

  const updateMeeting = async (meetingId: string, payload: ScheduleMeetingPayload) => {
    if (!leadId) {
      throw new Error('Lead ID tidak tersedia.');
    }
    const meeting = await leadMeetingsService.update(leadId, meetingId, payload);
    await fetchMeetings({ silent: true });
    return meeting;
  };

  return {
    meetings,
    isLoading,
    loadError,
    refetch: fetchMeetings,
    scheduleMeeting,
    completeMeeting,
    cancelMeeting,
    updateMeeting
  };
};

export const useLeadMeetingMinutes = (leadId?: string, meetingId?: string | null) => {
  const [detail, setDetail] = useState<LeadWorkspaceMeetingMinutesView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchMinutes = useCallback(async (options?: { silent?: boolean }) => {
    if (!leadId || !meetingId) {
      setDetail(null);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    if (!options?.silent) {
      setIsLoading(true);
    }
    setLoadError(null);
    try {
      const entry = await leadMeetingsService.getMinutes(leadId, meetingId);
      setDetail(entry);
    } catch (e) {
      setDetail(null);
      setLoadError(e instanceof Error ? e.message : 'Gagal memuat notulensi meeting.');
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, [leadId, meetingId]);

  useEffect(() => {
    void fetchMinutes();
  }, [fetchMinutes]);

  const createMinutes = async (payload: SaveMeetingMinutesPayload) => {
    if (!leadId || !meetingId) {
      throw new Error('Meeting tidak tersedia.');
    }
    const entry = await leadMeetingsService.createMinutes(leadId, meetingId, payload);
    setDetail(entry);
    return entry;
  };

  const updateMinutes = async (payload: SaveMeetingMinutesPayload) => {
    if (!leadId || !meetingId) {
      throw new Error('Meeting tidak tersedia.');
    }
    const entry = await leadMeetingsService.updateMinutes(leadId, meetingId, payload);
    setDetail(entry);
    return entry;
  };

  return {
    detail,
    isLoading,
    loadError,
    refetch: fetchMinutes,
    createMinutes,
    updateMinutes
  };
};
