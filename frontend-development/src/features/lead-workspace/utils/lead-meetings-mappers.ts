import type {
  ApiLeadMeetingMinutesEntry,
  ApiLeadMeetingRow,
  ApiSaveMeetingMinutesBody,
  ApiScheduleMeetingBody
} from '../services/lead-workspace-meetings-api';
import type {
  LeadWorkspaceMeetingListItem,
  LeadWorkspaceMeetingMinutesDetail,
  LeadWorkspaceMeetingMinutesView,
  SaveMeetingMinutesPayload,
  ScheduleMeetingPayload
} from '../types/lead-meetings.types';

const emptyMinutesDetail = (): LeadWorkspaceMeetingMinutesDetail => ({
  participants: { internal: [], client: [] },
  objectives: '',
  discussionSummary: {
    background: '',
    issuesDiscussed: '',
    clientInfo: '',
    firmInfo: '',
    risks: ''
  },
  agreements: [],
  nextSteps: '',
  followUpNotes: ''
});

export const mapLeadMeetingRow = (row: ApiLeadMeetingRow): LeadWorkspaceMeetingListItem => ({
  id: String(row.meeting_id),
  title: row.title,
  mode: row.meeting_mode,
  platformOrLocation: row.meeting_access ?? '',
  date: row.meeting_datetime,
  status: row.status,
  notes: row.notes ?? '',
  hasMinutes: row.has_minutes,
  createdByName: row.created_by_name
});

const mapMinutesDetail = (entry: ApiLeadMeetingMinutesEntry): LeadWorkspaceMeetingMinutesDetail | null => {
  if (!entry.minutes) {
    return null;
  }

  return {
    participants: {
      internal: entry.participants.internal,
      client: entry.participants.client
    },
    objectives: entry.minutes.meeting_objectives ?? '',
    discussionSummary: {
      background: entry.minutes.background_summary ?? '',
      issuesDiscussed: entry.minutes.issues_discussed ?? '',
      clientInfo: entry.minutes.info_client ?? '',
      firmInfo: entry.minutes.info_firm ?? '',
      risks: entry.minutes.risk_concerns ?? ''
    },
    agreements: entry.agreements.map((agreement) => ({
      item: agreement.item,
      details: agreement.details ?? ''
    })),
    nextSteps: entry.minutes.next_steps ?? '',
    followUpNotes: entry.minutes.notes_follow_up ?? ''
  };
};

export const mapLeadMeetingMinutesEntry = (entry: ApiLeadMeetingMinutesEntry): LeadWorkspaceMeetingMinutesView => ({
  meeting: mapLeadMeetingRow(entry.meeting),
  minutesDetail: mapMinutesDetail(entry)
});

export const mapScheduleMeetingPayload = (payload: ScheduleMeetingPayload): ApiScheduleMeetingBody => ({
  title: payload.title,
  meeting_datetime: payload.meetingDatetime,
  meeting_mode: payload.meetingMode,
  meeting_access: payload.meetingAccess,
  notes: payload.notes?.trim() || null
});

export const mapSaveMeetingMinutesPayload = (payload: SaveMeetingMinutesPayload): ApiSaveMeetingMinutesBody => ({
  meeting_objectives: payload.meetingObjectives?.trim() || null,
  background_summary: payload.backgroundSummary?.trim() || null,
  issues_discussed: payload.issuesDiscussed?.trim() || null,
  info_client: payload.infoClient?.trim() || null,
  info_firm: payload.infoFirm?.trim() || null,
  risk_concerns: payload.riskConcerns?.trim() || null,
  next_steps: payload.nextSteps?.trim() || null,
  notes_follow_up: payload.notesFollowUp?.trim() || null,
  internal_participants: payload.internalParticipants.map((item) => item.trim()).filter(Boolean),
  client_participants: payload.clientParticipants.map((item) => item.trim()).filter(Boolean),
  agreements: payload.agreements
    .map((agreement) => ({
      item: agreement.item.trim(),
      details: agreement.details?.trim() || null
    }))
    .filter((agreement) => agreement.item.length > 0)
});

export const buildEmptyMinutesDetail = emptyMinutesDetail;

export const buildMinutesPayloadFromDetail = (
  detail: LeadWorkspaceMeetingMinutesDetail
): SaveMeetingMinutesPayload => ({
  meetingObjectives: detail.objectives,
  backgroundSummary: detail.discussionSummary.background,
  issuesDiscussed: detail.discussionSummary.issuesDiscussed,
  infoClient: detail.discussionSummary.clientInfo,
  infoFirm: detail.discussionSummary.firmInfo,
  riskConcerns: detail.discussionSummary.risks,
  nextSteps: detail.nextSteps,
  notesFollowUp: detail.followUpNotes,
  internalParticipants: detail.participants.internal,
  clientParticipants: detail.participants.client,
  agreements: detail.agreements
});

const toDatetimeLocalValue = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

export const mapMeetingToSchedulePayload = (meeting: LeadWorkspaceMeetingListItem): ScheduleMeetingPayload => ({
  title: meeting.title,
  meetingDatetime: toDatetimeLocalValue(meeting.date),
  meetingMode: meeting.mode,
  meetingAccess: meeting.platformOrLocation,
  notes: meeting.notes
});
