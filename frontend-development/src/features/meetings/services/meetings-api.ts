import { apiGet } from '../../../services/api-client';
import type { MeetingMode, MeetingStatus } from '../types/meetings.types';

export interface ApiMeetingMonitorRow {
  meeting_id: number;
  lead_id: number;
  title: string;
  meeting_datetime: string;
  meeting_mode: MeetingMode;
  meeting_access: string | null;
  notes: string | null;
  status: MeetingStatus;
  has_minutes: boolean;
  company_name: string | null;
  pic_name: string | null;
  processed_by: number | null;
  processed_by_name: string | null;
}

export interface ApiMeetingMonitorSummary {
  total_meeting: { value: number };
  today: { value: number };
  upcoming: { value: number };
  completed: { value: number };
  no_minutes: { value: number };
}

export interface ApiMeetingMonitorListResponse {
  success: boolean;
  data: {
    items: ApiMeetingMonitorRow[];
    summary: ApiMeetingMonitorSummary;
    meta: {
      scope: 'organization' | 'own_leads' | 'filtered_user';
      summary_processed_by?: number;
    };
  };
}

export type MeetingMonitorSummaryQuery = { processedByUserId: number } | null;

export const getMeetingsMonitorList = async (
  summaryHandledByTarget: MeetingMonitorSummaryQuery = null
): Promise<ApiMeetingMonitorListResponse['data']> => {
  const params = new URLSearchParams();
  if (summaryHandledByTarget?.processedByUserId != null) {
    params.set('summary_processed_by', String(summaryHandledByTarget.processedByUserId));
  }
  const qs = params.toString();
  const path = qs.length > 0 ? `/meetings?${qs}` : '/meetings';
  const res = await apiGet<ApiMeetingMonitorListResponse>(path);
  return res.data;
};
