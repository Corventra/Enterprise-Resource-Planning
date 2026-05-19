import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { Toast } from '../../../components/ui/toast';
import { useToast } from '../../../hooks/use-toast';
import { MEETING_TOAST } from '../constants/lead-meeting-toast';
import { EditMeetingMinutesDialog } from '../components/modals/edit-meeting-minutes-dialog';
import { CancelMeetingConfirmDialog } from '../components/modals/cancel-meeting-confirm-dialog';
import { MarkMeetingDoneConfirmDialog } from '../components/modals/mark-meeting-done-confirm-dialog';
import { ScheduleMeetingDialog } from '../components/modals/schedule-meeting-dialog';
import { MeetingHistorySection } from '../components/meeting-history-section';
import { MeetingMinutesSection } from '../components/meeting-minutes-section';
import { useLeadMeetingMinutes, useLeadMeetings } from '../hooks/use-lead-meetings';
import type { LeadWorkspaceOutletContext } from '../types/lead-workspace.types';
import type { LeadWorkspaceMeetingListItem, SaveMeetingMinutesPayload, ScheduleMeetingPayload } from '../types/lead-meetings.types';
import { buildMinutesPayloadFromDetail, mapMeetingToSchedulePayload } from '../utils/lead-meetings-mappers';

export const MeetingPage = () => {
  const { leadId, refetchWorkspace } = useOutletContext<LeadWorkspaceOutletContext>();
  const { meetings, isLoading, loadError, refetch, scheduleMeeting, completeMeeting, cancelMeeting, updateMeeting } =
    useLeadMeetings(leadId);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(meetings[0]?.id ?? null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'create' | 'edit'>('create');
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [minutesOpen, setMinutesOpen] = useState(false);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [minutesBusy, setMinutesBusy] = useState(false);
  const [markDoneTarget, setMarkDoneTarget] = useState<LeadWorkspaceMeetingListItem | null>(null);
  const [markDoneBusy, setMarkDoneBusy] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<LeadWorkspaceMeetingListItem | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const { message: toastMessage, variant: toastVariant, dismiss: dismissToast, show: showToast } = useToast();

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
        await refetchMinutes({ silent: true });
      } else {
        const meeting = await scheduleMeeting(normalizedPayload);
        setSelectedMeetingId(meeting.id);
      }

      const wasEdit = scheduleMode === 'edit';
      setScheduleOpen(false);
      setEditingMeetingId(null);
      showToast(wasEdit ? MEETING_TOAST.updated : MEETING_TOAST.scheduled);
      await refetchWorkspace({ silent: true });
    } finally {
      setScheduleBusy(false);
    }
  };

  const handleMarkDoneRequest = (meetingId: string) => {
    const meeting = meetings.find((item) => item.id === meetingId);
    if (meeting) setMarkDoneTarget(meeting);
  };

  const handleMarkDoneConfirm = async (meetingId: string) => {
    setMarkDoneBusy(true);
    try {
      await completeMeeting(meetingId);
      setSelectedMeetingId(meetingId);
      setMarkDoneTarget(null);
      showToast(MEETING_TOAST.markedDone);
      await refetchMinutes({ silent: true });
      await refetchWorkspace({ silent: true });
    } catch {
      throw new Error('Gagal menandai meeting selesai.');
    } finally {
      setMarkDoneBusy(false);
    }
  };

  const handleCancelRequest = (meetingId: string) => {
    const meeting = meetings.find((item) => item.id === meetingId);
    if (meeting) setCancelTarget(meeting);
  };

  const handleCancelConfirm = async (meetingId: string) => {
    setCancelBusy(true);
    try {
      await cancelMeeting(meetingId);
      setCancelTarget(null);
      showToast(MEETING_TOAST.cancelled);
      await refetchMinutes({ silent: true });
      await refetchWorkspace({ silent: true });
    } catch {
      throw new Error('Gagal membatalkan meeting.');
    } finally {
      setCancelBusy(false);
    }
  };

  const handleSaveMinutes = async (payload: SaveMeetingMinutesPayload) => {
    if (!selectedMeetingId) return;
    const wasCreate = minutesMode === 'create';
    setMinutesBusy(true);
    try {
      if (wasCreate) {
        await createMinutes(payload);
      } else {
        await updateMinutes(payload);
      }
      setMinutesOpen(false);
      showToast(wasCreate ? MEETING_TOAST.minutesCreated : MEETING_TOAST.minutesUpdated);
      await refetch({ silent: true });
      await refetchWorkspace({ silent: true });
    } finally {
      setMinutesBusy(false);
    }
  };

  const minutesInitialDetail = detail?.minutesDetail ? buildMinutesPayloadFromDetail(detail.minutesDetail) : null;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-6 text-sm text-[#737784] shadow-sm">
        Memuat meeting & notulensi…
      </div>
    );
  }

  return (
    <>
      <section className="grid grid-cols-12 gap-6">
        {loadError ? (
          <div className="col-span-12 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {loadError}
            <button
              type="button"
              onClick={() => void refetch()}
              className="ml-3 font-bold text-[#003c90] underline"
            >
              Coba lagi
            </button>
          </div>
        ) : null}
        {minutesLoadError && selectedMeetingId ? (
          <div className="col-span-12 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {minutesLoadError}
            <button
              type="button"
              onClick={() => void refetchMinutes()}
              className="ml-3 font-bold text-[#003c90] underline"
            >
              Coba lagi
            </button>
          </div>
        ) : null}
        <MeetingHistorySection
          meetings={meetings}
          selectedMeetingId={selectedMeetingId ?? undefined}
          isLoading={false}
          loadError={null}
          onSelectMeeting={setSelectedMeetingId}
          onScheduleMeeting={openCreateMeeting}
          onEditMeeting={openEditMeeting}
          onMarkDone={handleMarkDoneRequest}
          onCancelMeeting={handleCancelRequest}
          markDoneBusyMeetingId={markDoneBusy ? markDoneTarget?.id ?? null : null}
          cancelBusyMeetingId={cancelBusy ? cancelTarget?.id ?? null : null}
        />
        <MeetingMinutesSection
          detail={detail}
          isLoading={minutesLoading}
          loadError={null}
          onEditMinutes={() => setMinutesOpen(true)}
          meetingsEmpty={meetings.length === 0}
          onScheduleMeeting={openCreateMeeting}
        />
      </section>

      <MarkMeetingDoneConfirmDialog
        open={Boolean(markDoneTarget)}
        meeting={markDoneTarget ?? undefined}
        busy={markDoneBusy}
        onClose={() => {
          if (markDoneBusy) return;
          setMarkDoneTarget(null);
        }}
        onConfirm={handleMarkDoneConfirm}
      />

      <CancelMeetingConfirmDialog
        open={Boolean(cancelTarget)}
        meeting={cancelTarget ?? undefined}
        busy={cancelBusy}
        onClose={() => {
          if (cancelBusy) return;
          setCancelTarget(null);
        }}
        onConfirm={handleCancelConfirm}
      />

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

      <Toast
        open={toastMessage != null}
        message={toastMessage ?? ''}
        variant={toastVariant}
        onClose={dismissToast}
      />
    </>
  );
};
