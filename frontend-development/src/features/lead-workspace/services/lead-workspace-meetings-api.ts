import { apiGet, apiPatch, apiPost } from '../../../services/api-client';
import type { MeetingMode } from '../types/lead-meetings.types';

export interface ApiLeadMeetingRow {
  meeting_id: number;
  lead_id: number;
  title: string;
  meeting_datetime: string;
  meeting_mode: MeetingMode;
  meeting_access: string | null;
  notes: string | null;
  status: 'SCHEDULED' | 'DONE' | 'CANCELLED';
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  minute_id: number | null;
  has_minutes: boolean;
}

export interface ApiLeadMeetingMinutesRow {
  minute_id: number;
  meeting_id: number;
  lead_id: number;
  meeting_objectives: string | null;
  background_summary: string | null;
  issues_discussed: string | null;
  info_client: string | null;
  info_firm: string | null;
  risk_concerns: string | null;
  next_steps: string | null;
  notes_follow_up: string | null;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiLeadMeetingMinutesEntry {
  meeting: ApiLeadMeetingRow;
  minutes: ApiLeadMeetingMinutesRow | null;
  participants: {
    internal: string[];
    client: string[];
  };
  agreements: Array<{
    item: string;
    details: string | null;
  }>;
}

export interface ApiScheduleMeetingBody {
  title: string;
  meeting_datetime: string;
  meeting_mode: MeetingMode;
  meeting_access: string;
  notes?: string | null;
}

export interface ApiSaveMeetingMinutesBody {
  meeting_objectives?: string | null;
  background_summary?: string | null;
  issues_discussed?: string | null;
  info_client?: string | null;
  info_firm?: string | null;
  risk_concerns?: string | null;
  next_steps?: string | null;
  notes_follow_up?: string | null;
  internal_participants: string[];
  client_participants: string[];
  agreements: Array<{
    item: string;
    details?: string | null;
  }>;
}

interface ApiMeetingListResponse {
  success: boolean;
  data: { items: ApiLeadMeetingRow[] };
}

interface ApiMeetingMutationResponse {
  success: boolean;
  message?: string;
  data: { meeting: ApiLeadMeetingRow };
}

interface ApiMinutesResponse {
  success: boolean;
  data: { entry: ApiLeadMeetingMinutesEntry };
}

export const getLeadMeetings = async (leadId: string): Promise<ApiLeadMeetingRow[]> => {
  const res = await apiGet<ApiMeetingListResponse>(`/lead-workspace/${leadId}/meetings`);
  return res.data.items;
};

export const postLeadMeeting = async (leadId: string, body: ApiScheduleMeetingBody): Promise<ApiLeadMeetingRow> => {
  const res = await apiPost<ApiMeetingMutationResponse>(`/lead-workspace/${leadId}/meetings`, body);
  return res.data.meeting;
};

export const patchCompleteLeadMeeting = async (leadId: string, meetingId: string): Promise<ApiLeadMeetingRow> => {
  const res = await apiPatch<ApiMeetingMutationResponse>(
    `/lead-workspace/${leadId}/meetings/${meetingId}/complete`,
    {}
  );
  return res.data.meeting;
};

export const patchLeadMeeting = async (
  leadId: string,
  meetingId: string,
  body: ApiScheduleMeetingBody
): Promise<ApiLeadMeetingRow> => {
  const res = await apiPatch<ApiMeetingMutationResponse>(`/lead-workspace/${leadId}/meetings/${meetingId}`, body);
  return res.data.meeting;
};

export const getLeadMeetingMinutes = async (
  leadId: string,
  meetingId: string
): Promise<ApiLeadMeetingMinutesEntry> => {
  const res = await apiGet<ApiMinutesResponse>(`/lead-workspace/${leadId}/meetings/${meetingId}/minutes`);
  return res.data.entry;
};

export const postLeadMeetingMinutes = async (
  leadId: string,
  meetingId: string,
  body: ApiSaveMeetingMinutesBody
): Promise<ApiLeadMeetingMinutesEntry> => {
  const res = await apiPost<ApiMinutesResponse>(`/lead-workspace/${leadId}/meetings/${meetingId}/minutes`, body);
  return res.data.entry;
};

export const patchLeadMeetingMinutes = async (
  leadId: string,
  meetingId: string,
  body: ApiSaveMeetingMinutesBody
): Promise<ApiLeadMeetingMinutesEntry> => {
  const res = await apiPatch<ApiMinutesResponse>(`/lead-workspace/${leadId}/meetings/${meetingId}/minutes`, body);
  return res.data.entry;
};
