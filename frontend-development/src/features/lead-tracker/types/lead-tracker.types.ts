export type LeadStage = 'MEETING' | 'MINUTES' | 'PROPOSAL' | 'ENGAGEMENT_LETTER';

export type LeadPipelineStatus = 'ACTIVE' | 'WON' | 'LOST';

export type StageProgress =
  | 'NOT_SCHEDULED'
  | 'SCHEDULED'
  | 'DONE'
  | 'NOT_CREATED'
  | 'WAITING_CEO_APPROVAL'
  | 'REVISION'
  | 'APPROVED'
  | 'SENT'
  | 'RESPONDED'
  | 'SIGNED';

export interface LeadTrackerItem {
  id: string;
  leadCode: string;
  companyName: string;
  picName: string;
  email: string;
  phoneNumber: string;
  currentStage: LeadStage;
  stageProgress: StageProgress;
  processedBy: string | null;
  processedByUserId: number | null;
  processedAt: string | null;
  nextAction: string | null;
  dueDate: string | null;
  leadStatus: LeadPipelineStatus;
}

export interface LeadTrackerSummaryMetric {
  value: number;
  previous: number;
  delta: { value: number; direction: 'up' | 'down' | 'flat' };
}

export interface LeadTrackerSnapshotCount {
  value: number;
}

export interface LeadTrackerSummary {
  totalLeads: LeadTrackerSummaryMetric;
  activeLeads: LeadTrackerSnapshotCount;
  wonLeads: LeadTrackerSummaryMetric;
  lostLeads: LeadTrackerSummaryMetric;
}

export type LeadTrackerSummaryScope =
  | 'own_leads'
  | 'organization'
  | 'filtered_user'
  | 'filtered_unassigned';

export interface LeadTrackerListMeta {
  period: string;
  periodStart: string;
  periodEndExclusive: string;
  comparisonLabel: string;
  scope: LeadTrackerSummaryScope;
  summaryProcessedByUserId?: number;
}

/** Target summary untuk CEO/COO saat filter processor dipilih. */
export type LeadTrackerSummaryProcessedByTarget = number | 'unassigned' | null;

export interface LeadTrackerFilters {
  search: string;
  stage: LeadStage | 'All';
  status: LeadPipelineStatus | 'All';
  /** Nama user yang memproses lead dari API, `Unassigned`, atau `All` */
  processedBy: string;
}

export type LostReasonCode =
  | 'NO_RESPONSE'
  | 'NOT_INTERESTED'
  | 'BUDGET_ISSUE'
  | 'LOST_TO_COMPETITOR'
  | 'TIMING_NOT_RIGHT'
  | 'NOT_QUALIFIED'
  | 'INTERNAL_DECISION'
  | 'OTHER';

export interface CreateManualLeadPayload {
  companyName: string;
  companyAddress: string;
  picName: string;
  email: string;
  phoneNumber: string;
  desiredServices?: string;
}

export interface MarkLeadLostPayload {
  lostReasonCode: LostReasonCode;
  lostReasonNote?: string;
}

export const leadStageLabelMap: Record<LeadStage, string> = {
  MEETING: 'Meeting',
  MINUTES: 'Notulensi',
  PROPOSAL: 'Proposal',
  ENGAGEMENT_LETTER: 'Engagement Letter'
};

export const leadStatusLabelMap: Record<LeadPipelineStatus, string> = {
  ACTIVE: 'Active',
  WON: 'Won',
  LOST: 'Lost'
};

export const lostReasonLabelMap: Record<LostReasonCode, string> = {
  NO_RESPONSE: 'No Response',
  NOT_INTERESTED: 'Not Interested',
  BUDGET_ISSUE: 'Budget Issue',
  LOST_TO_COMPETITOR: 'Lost to Competitor',
  TIMING_NOT_RIGHT: 'Timing Not Right',
  NOT_QUALIFIED: 'Not Qualified',
  INTERNAL_DECISION: 'Internal Decision',
  OTHER: 'Other'
};

export const stageProgressLabelMap: Record<StageProgress, string> = {
  NOT_SCHEDULED: 'Not Scheduled',
  SCHEDULED: 'Scheduled',
  DONE: 'Done',
  NOT_CREATED: 'Not Created',
  WAITING_CEO_APPROVAL: 'Waiting CEO Approval',
  REVISION: 'Revision',
  APPROVED: 'Approved',
  SENT: 'Sent',
  RESPONDED: 'Responded',
  SIGNED: 'Signed'
};
