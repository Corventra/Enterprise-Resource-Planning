import type { MeetingMode, MeetingStatus } from '../../lead-workspace/types/lead-meetings.types';

export type { MeetingMode, MeetingStatus };

export type MeetingMinutesFilter = 'All' | 'HAS_MINUTES' | 'NO_MINUTES';

export interface MeetingMonitorItem {
  id: string;
  leadId: string;
  title: string;
  meetingDatetime: string;
  mode: MeetingMode;
  meetingAccess: string;
  notes: string;
  status: MeetingStatus;
  hasMinutes: boolean;
  companyName: string;
  picName: string;
  handledById: number | null;
  handledByName: string;
}

export interface MeetingSnapshotCount {
  value: number;
}

export interface MeetingMonitorSummary {
  totalMeeting: MeetingSnapshotCount;
  today: MeetingSnapshotCount;
  upcoming: MeetingSnapshotCount;
  completed: MeetingSnapshotCount;
  noMinutes: MeetingSnapshotCount;
}

export type MeetingMonitorScope = 'organization' | 'own_leads' | 'filtered_user';

export interface MeetingMonitorMeta {
  scope: MeetingMonitorScope;
  summaryProcessedByUserId?: number;
}

export type MeetingSummaryHandledByTarget = number | null;

export interface MeetingMonitorFilters {
  search: string;
  status: MeetingStatus | 'All';
  mode: MeetingMode | 'All';
  minutes: MeetingMinutesFilter;
  handledBy: string;
}
