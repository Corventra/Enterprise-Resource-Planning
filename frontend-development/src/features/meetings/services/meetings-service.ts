import { patchCompleteLeadMeeting } from '../../lead-workspace/services/lead-workspace-meetings-api';
import type {
  MeetingMonitorItem,
  MeetingMonitorMeta,
  MeetingMonitorSummary,
  MeetingSummaryHandledByTarget
} from '../types/meetings.types';
import { getMeetingsMonitorList, type ApiMeetingMonitorRow } from './meetings-api';

const mapItem = (row: ApiMeetingMonitorRow): MeetingMonitorItem => ({
  id: String(row.meeting_id),
  leadId: String(row.lead_id),
  title: row.title,
  meetingDatetime: row.meeting_datetime,
  mode: row.meeting_mode,
  meetingAccess: row.meeting_access?.trim() ?? '',
  notes: row.notes?.trim() ?? '',
  status: row.status,
  hasMinutes: row.has_minutes,
  companyName: row.company_name?.trim() || '—',
  picName: row.pic_name?.trim() || '—',
  handledById: row.processed_by,
  handledByName: row.processed_by_name?.trim() || '—'
});

const mapSummary = (row: {
  total_meeting: { value: number };
  today: { value: number };
  upcoming: { value: number };
  completed: { value: number };
  no_minutes: { value: number };
}): MeetingMonitorSummary => ({
  totalMeeting: { value: row.total_meeting.value },
  today: { value: row.today.value },
  upcoming: { value: row.upcoming.value },
  completed: { value: row.completed.value },
  noMinutes: { value: row.no_minutes.value }
});

const toSummaryQuery = (target: MeetingSummaryHandledByTarget) => {
  if (target == null) return null;
  return { processedByUserId: target };
};

export const meetingsService = {
  async getList(summaryHandledByTarget: MeetingSummaryHandledByTarget = null): Promise<{
    items: MeetingMonitorItem[];
    summary: MeetingMonitorSummary;
    meta: MeetingMonitorMeta;
  }> {
    const data = await getMeetingsMonitorList(toSummaryQuery(summaryHandledByTarget));
    return {
      items: data.items.map(mapItem),
      summary: mapSummary(data.summary),
      meta: {
        scope: data.meta.scope,
        summaryProcessedByUserId: data.meta.summary_processed_by
      }
    };
  },

  completeMeeting(leadId: string, meetingId: string) {
    return patchCompleteLeadMeeting(leadId, meetingId);
  }
};
