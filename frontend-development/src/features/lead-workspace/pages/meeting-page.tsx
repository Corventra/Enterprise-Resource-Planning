import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { EditMeetingMinutesDialog } from '../components/modals/edit-meeting-minutes-dialog';
import { ScheduleMeetingDialog } from '../components/modals/schedule-meeting-dialog';
import { MeetingHistorySection } from '../components/meeting-history-section';
import { MeetingMinutesSection } from '../components/meeting-minutes-section';
import { useLeadMeetingMinutes, useLeadMeetings } from '../hooks/use-lead-meetings';
import type { LeadWorkspaceOutletContext } from '../types/lead-workspace.types';
import type { SaveMeetingMinutesPayload, ScheduleMeetingPayload } from '../types/lead-meetings.types';
import { buildMinutesPayloadFromDetail, mapMeetingToSchedulePayload } from '../utils/lead-meetings-mappers';

export const MeetingPage = () => {
  const { leadId, refetchWorkspace } = useOutletContext<LeadWorkspaceOutletContext>();
  const { meetings, isLoading, loadError, refetch, scheduleMeeting, completeMeeting, updateMeeting } =
    useLeadMeetings(leadId);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(meetings[0]?.id ?? null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'create' | 'edit'>('create');
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [minutesOpen, setMinutesOpen] = useState(false);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [minutesBusy, setMinutesBusy] = useState(false);
  const [markDoneBusyMeetingId, setMarkDoneBusyMeetingId] = useState<string | null>(null);

  const {
    detail,
    isLoading: minutesLoading,
    loadError: minutesLoadError,
    refetch: refetchMinutes,
    createMinutes,
    updateMinutes
  } = useLeadMeetingMinutes(leadId, selectedMeetingId);

  useEffect(() => {
    if (meetings.length === 0) {
      setSelectedMeetingId(null);
      return;
    }

    const hasSelectedMeeting = meetings.some((meeting) => meeting.id === selectedMeetingId);
    if (!hasSelectedMeeting) {
      setSelectedMeetingId(meetings[0].id);
    }
  }, [meetings, selectedMeetingId]);

  const minutesMode = useMemo<'create' | 'edit'>(() => (detail?.minutesDetail ? 'edit' : 'create'), [detail?.minutesDetail]);

  const editingMeeting = useMemo(
    () => meetings.find((meeting) => meeting.id === editingMeetingId) ?? null,
    [meetings, editingMeetingId]
  );

  const scheduleInitialMeeting = useMemo(
    () => (editingMeeting ? mapMeetingToSchedulePayload(editingMeeting) : null),
    [editingMeeting]
  );

  const openCreateMeeting = () => {
    setScheduleMode('create');
    setEditingMeetingId(null);
    setScheduleOpen(true);
  };

  const openEditMeeting = (meetingId: string) => {
    setScheduleMode('edit');
    setEditingMeetingId(meetingId);
    setScheduleOpen(true);
  };

  const handleScheduleMeeting = async (payload: ScheduleMeetingPayload) => {
    setScheduleBusy(true);
    try {
      const normalizedPayload = {
        ...payload,
        meetingDatetime: new Date(payload.meetingDatetime).toISOString()
      };

      if (scheduleMode === 'edit' && editingMeetingId) {
        await updateMeeting(editingMeetingId, normalizedPayload);
        setSelectedMeetingId(editingMeetingId);
        await refetchMinutes();
      } else {
        const meeting = await scheduleMeeting(normalizedPayload);
        setSelectedMeetingId(meeting.id);
      }

      setScheduleOpen(false);
      setEditingMeetingId(null);
      await refetchWorkspace();
    } finally {
      setScheduleBusy(false);
    }
  };

  const handleMarkDone = async (meetingId: string) => {
    setMarkDoneBusyMeetingId(meetingId);
    try {
      await completeMeeting(meetingId);
      setSelectedMeetingId(meetingId);
      await refetchMinutes();
      await refetchWorkspace();
    } finally {
      setMarkDoneBusyMeetingId(null);
    }
  };

  const handleSaveMinutes = async (payload: SaveMeetingMinutesPayload) => {
    if (!selectedMeetingId) return;
    setMinutesBusy(true);
    try {
      if (minutesMode === 'create') {
        await createMinutes(payload);
      } else {
        await updateMinutes(payload);
      }
      setMinutesOpen(false);
      await refetch();
      await refetchWorkspace();
    } finally {
      setMinutesBusy(false);
    }
  };

  const minutesInitialDetail = detail?.minutesDetail ? buildMinutesPayloadFromDetail(detail.minutesDetail) : null;

  return (
    <>
      <section className="grid grid-cols-12 gap-6">
        <MeetingHistorySection
          meetings={meetings}
          selectedMeetingId={selectedMeetingId ?? undefined}
          isLoading={isLoading}
          loadError={loadError}
          onSelectMeeting={setSelectedMeetingId}
          onScheduleMeeting={openCreateMeeting}
          onEditMeeting={openEditMeeting}
          onMarkDone={handleMarkDone}
          markDoneBusyMeetingId={markDoneBusyMeetingId}
        />
        <MeetingMinutesSection
          detail={detail}
          isLoading={minutesLoading}
          loadError={minutesLoadError}
          onEditMinutes={() => setMinutesOpen(true)}
        />
      </section>

      <ScheduleMeetingDialog
        open={scheduleOpen}
        mode={scheduleMode}
        initialMeeting={scheduleInitialMeeting}
        busy={scheduleBusy}
        onClose={() => {
          setScheduleOpen(false);
          setEditingMeetingId(null);
        }}
        onSubmit={handleScheduleMeeting}
      />

      <EditMeetingMinutesDialog
        open={minutesOpen}
        mode={minutesMode}
        busy={minutesBusy}
        initialDetail={minutesInitialDetail}
        onClose={() => setMinutesOpen(false)}
        onSubmit={handleSaveMinutes}
      />
    </>
  );
};
