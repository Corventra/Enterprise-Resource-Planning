export const LEAD_ACTIVITY_TYPES = [
  'BANK_DATA_PROCESSED',
  'BANK_DATA_ARCHIVED',
  'LEAD_CREATED_MANUAL',
  'LEAD_DETAILS_UPDATED',
  'LEAD_LOST',
  'LEAD_WON',
  'MEETING_SCHEDULED',
  'MEETING_UPDATED',
  'MEETING_COMPLETED',
  'MINUTES_CREATED',
  'MINUTES_UPDATED',
  'PROPOSAL_CREATED',
  'PROPOSAL_SUBMITTED',
  'PROPOSAL_APPROVED',
  'PROPOSAL_REVISION_REQUESTED',
  'PROPOSAL_SENT',
  'PROPOSAL_RESPONDED',
  'ENGAGEMENT_LETTER_CREATED',
  'ENGAGEMENT_LETTER_SUBMITTED',
  'ENGAGEMENT_LETTER_APPROVED',
  'ENGAGEMENT_LETTER_REVISION_REQUESTED',
  'ENGAGEMENT_LETTER_SENT',
  'ENGAGEMENT_LETTER_SIGNED'
] as const;

export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number];

export interface LeadWorkspaceActivityLogItem {
  id: string;
  activityType: LeadActivityType;
  title: string;
  description: string | null;
  createdAt: string;
  createdBy: number | null;
  createdByName: string | null;
}
