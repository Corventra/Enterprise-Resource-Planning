import type { ApiLeadTrackerListRow } from '../services/lead-tracker-api';
import type { LeadPipelineStatus, LeadStage, LeadTrackerItem, StageProgress } from '../types/lead-tracker.types';

const mapLeadStage = (stage: ApiLeadTrackerListRow['current_stage']): LeadStage => stage;

const mapLeadStatus = (status: ApiLeadTrackerListRow['lead_status']): LeadPipelineStatus => status;

const mapStageProgress = (progress: string): StageProgress => progress as StageProgress;

export const mapLeadTrackerListRow = (row: ApiLeadTrackerListRow): LeadTrackerItem => ({
  id: String(row.lead_id),
  companyName: row.company_name,
  picName: row.pic_name,
  email: row.email,
  phoneNumber: row.phone_number,
  currentStage: mapLeadStage(row.current_stage),
  stageProgress: mapStageProgress(row.stage_progress),
  processedBy: row.processed_by_name,
  processedAt: row.processed_at,
  nextAction: row.next_action,
  dueDate: row.due_date,
  leadStatus: mapLeadStatus(row.lead_status)
});
