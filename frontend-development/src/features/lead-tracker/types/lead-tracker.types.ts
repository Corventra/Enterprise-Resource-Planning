export type LeadStage = 'MEETING' | 'NOTULENSI' | 'PROPOSAL' | 'ENGAGEMENT_LETTER';

export type MeetingStageProgress =
  | 'Not Scheduled'
  | 'Scheduled'
  | 'Rescheduled'
  | 'Completed'
  | 'No Show'
  | 'Follow Up Required';

export type NotulensiStageProgress = 'Not Created' | 'Drafting' | 'Submitted' | 'Revision Needed';

export type ProposalStageProgress =
  | 'Not Created'
  | 'Drafting'
  | 'Submitted for Approval'
  | 'Revision Needed'
  | 'Approved'
  | 'Sent to Client'
  | 'Client Reviewing'
  | 'Accepted'
  | 'Rejected';

export type EngagementLetterStageProgress =
  | 'Not Created'
  | 'Drafting'
  | 'Submitted for Approval'
  | 'Revision Needed'
  | 'Approved'
  | 'Sent to Client'
  | 'Awaiting Signature'
  | 'Signed'
  | 'Declined';

export type NextAction =
  | 'Schedule meeting'
  | 'Reschedule meeting'
  | 'Conduct meeting'
  | 'Create notulensi'
  | 'Submit notulensi'
  | 'Revise notulensi'
  | 'Create proposal'
  | 'Submit proposal for approval'
  | 'Revise proposal'
  | 'Send proposal to client'
  | 'Follow up client feedback'
  | 'Create engagement letter'
  | 'Submit EL for approval'
  | 'Revise engagement letter'
  | 'Send EL to client'
  | 'Follow up signature'
  | 'Wait approval'
  | 'Wait review'
  | 'Close lead';

export type LeadTrackerStatus = 'Need Follow Up' | 'Need Revision' | 'Ready for Handover' | 'On Track';

export interface LeadStageProgressMap {
  MEETING: MeetingStageProgress;
  NOTULENSI: NotulensiStageProgress;
  PROPOSAL: ProposalStageProgress;
  ENGAGEMENT_LETTER: EngagementLetterStageProgress;
}

type LeadTrackerItemBase = {
  id: string;
  company: string;
  processedBy: string;
  processedAt: string;
  nextAction: NextAction;
  dueDate: string;
  status: LeadTrackerStatus;
};

export type LeadTrackerItem = {
  [S in LeadStage]: LeadTrackerItemBase & {
    currentStage: S;
    stageProgress: LeadStageProgressMap[S];
  };
}[LeadStage];

export interface LeadTrackerFilters {
  search: string;
  stage: LeadStage | 'All';
  status: LeadTrackerStatus | 'All';
}

export const leadStageLabelMap: Record<LeadStage, string> = {
  MEETING: 'Meeting',
  NOTULENSI: 'Notulensi',
  PROPOSAL: 'Proposal',
  ENGAGEMENT_LETTER: 'Engagement Letter'
};

export const stageProgressOrderMap: { [S in LeadStage]: readonly LeadStageProgressMap[S][] } = {
  MEETING: ['Not Scheduled', 'Scheduled', 'Rescheduled', 'Completed', 'No Show', 'Follow Up Required'],
  NOTULENSI: ['Not Created', 'Drafting', 'Submitted', 'Revision Needed'],
  PROPOSAL: [
    'Not Created',
    'Drafting',
    'Submitted for Approval',
    'Revision Needed',
    'Approved',
    'Sent to Client',
    'Client Reviewing',
    'Accepted',
    'Rejected'
  ],
  ENGAGEMENT_LETTER: [
    'Not Created',
    'Drafting',
    'Submitted for Approval',
    'Revision Needed',
    'Approved',
    'Sent to Client',
    'Awaiting Signature',
    'Signed',
    'Declined'
  ]
};
