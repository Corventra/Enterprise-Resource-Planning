export type MeetingMode = 'ONLINE' | 'OFFLINE';
export type MeetingStatus = 'SCHEDULED' | 'DONE' | 'CANCELLED';

export interface LeadWorkspaceMeetingListItem {
  id: string;
  title: string;
  mode: MeetingMode;
  platformOrLocation: string;
  date: string;
  status: MeetingStatus;
  notes: string;
  hasMinutes: boolean;
  createdByName: string | null;
}

export interface LeadWorkspaceMeetingMinutesDetail {
  participants: {
    internal: string[];
    client: string[];
  };
  objectives: string;
  discussionSummary: {
    background: string;
    issuesDiscussed: string;
    clientInfo: string;
    firmInfo: string;
    risks: string;
  };
  agreements: Array<{
    item: string;
    details: string;
  }>;
  nextSteps: string;
  followUpNotes: string;
}

export interface LeadWorkspaceMeetingMinutesView {
  meeting: LeadWorkspaceMeetingListItem;
  minutesDetail: LeadWorkspaceMeetingMinutesDetail | null;
}

export interface ScheduleMeetingPayload {
  title: string;
  meetingDatetime: string;
  meetingMode: MeetingMode;
  meetingAccess: string;
  notes?: string;
}

export interface SaveMeetingMinutesPayload {
  meetingObjectives?: string;
  backgroundSummary?: string;
  issuesDiscussed?: string;
  infoClient?: string;
  infoFirm?: string;
  riskConcerns?: string;
  nextSteps?: string;
  notesFollowUp?: string;
  internalParticipants: string[];
  clientParticipants: string[];
  agreements: Array<{
    item: string;
    details?: string;
  }>;
}
