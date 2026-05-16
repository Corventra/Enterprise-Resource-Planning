import type { LeadPipelineStatus, LeadStage, StageProgress } from '../types/lead-tracker.types';

const progressPercentMap: Record<string, number> = {
  MEETING_NOT_SCHEDULED: 0,
  MEETING_SCHEDULED: 9,
  MEETING_DONE: 18,
  MINUTES_NOT_CREATED: 18,
  MINUTES_DONE: 27,
  PROPOSAL_NOT_CREATED: 27,
  PROPOSAL_WAITING_CEO_APPROVAL: 36,
  PROPOSAL_REVISION: 36,
  PROPOSAL_APPROVED: 45,
  PROPOSAL_SENT: 55,
  PROPOSAL_RESPONDED: 64,
  ENGAGEMENT_LETTER_NOT_CREATED: 64,
  ENGAGEMENT_LETTER_WAITING_CEO_APPROVAL: 73,
  ENGAGEMENT_LETTER_REVISION: 73,
  ENGAGEMENT_LETTER_APPROVED: 82,
  ENGAGEMENT_LETTER_SENT: 91,
  ENGAGEMENT_LETTER_SIGNED: 100
};

export const getLeadPipelineProgressPercent = (
  currentStage: LeadStage,
  stageProgress: StageProgress,
  leadStatus: LeadPipelineStatus
): number => {
  if (leadStatus === 'WON') {
    return 100;
  }

  return progressPercentMap[`${currentStage}_${stageProgress}`] ?? 0;
};
