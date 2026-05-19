import type {
  ApiProjectConsultant,
  ApiProjectDetail,
  ApiProjectListRow,
  ApiProjectMilestone,
  ApiProjectMilestoneUpdate
} from '../services/projects-api';
import type {
  ConsultantLevel,
  DpPaymentStatus,
  Project,
  ProjectAssignee,
  ProjectConsultant,
  ProjectMilestone,
  ProjectMilestonePhase,
  ProjectMilestoneStatus,
  ProjectServiceLine,
  ProjectStatus,
  TaskUpdateLogEntry
} from '../types/project.types';

/**
 * Convert ISO datetime ke 'YYYY-MM-DD'. Backend MySQL DATE column auto-stringify
 * ke ISO datetime saat di-JSONify; frontend type pakai 'YYYY-MM-DD' supaya
 * konsisten dengan date input.
 */
const toIsoDate = (value: string | null): string => {
  if (!value) return '';
  return value.length >= 10 ? value.slice(0, 10) : value;
};

const toIsoDateTime = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  return value;
};

const mapAssignee = (id: number | null, name: string | null): ProjectAssignee | null => {
  if (id == null) return null;
  return { id: String(id), name: name ?? '' };
};

const mapConsultant = (row: ApiProjectConsultant): ProjectConsultant => ({
  id: String(row.consultant_user_id),
  name: row.consultant_name ?? '',
  level: row.level as ConsultantLevel
});

const mapUpdateLog = (row: ApiProjectMilestoneUpdate): TaskUpdateLogEntry => ({
  at: row.at,
  byId: row.by_user_id == null ? '' : String(row.by_user_id),
  byName: row.by_name ?? '',
  fromStatus: row.from_status as ProjectMilestoneStatus,
  toStatus: row.to_status as ProjectMilestoneStatus,
  note: row.note ?? undefined
});

const mapMilestone = (row: ApiProjectMilestone): ProjectMilestone => ({
  id: String(row.milestone_id),
  title: row.title,
  notes: row.notes ?? undefined,
  targetDate: toIsoDate(row.target_date),
  status: row.status as ProjectMilestoneStatus,
  ownerId: row.owner_user_id == null ? '' : String(row.owner_user_id),
  ownerName: row.owner_name ?? '',
  weight: row.weight,
  phase: (row.phase as ProjectMilestonePhase | null) ?? undefined,
  completedAt: toIsoDateTime(row.completed_at),
  qualityRating: row.quality_rating == null ? undefined : (row.quality_rating as 1 | 2 | 3 | 4 | 5),
  revisionCount: row.revision_count ?? undefined,
  updateLog: (row.updates ?? []).map(mapUpdateLog)
});

/**
 * List endpoint return shape ringkas (tanpa milestones/consultants).
 * Frontend type `Project` butuh array lengkap — kita isi empty di list,
 * caller (list page) tidak baca array tersebut.
 */
export const mapApiProjectListRowToProject = (row: ApiProjectListRow): Project => ({
  id: String(row.project_id),
  projectCode: row.project_code,
  handoverId: String(row.handover_id),
  client: row.client,
  projectName: row.project_name,
  serviceLine: row.service_line as ProjectServiceLine,
  status: row.status as ProjectStatus,
  pm: mapAssignee(row.pm_user_id, row.pm_name),
  consultants: [],
  startDate: toIsoDate(row.start_date),
  endDate: toIsoDate(row.end_date),
  milestones: [],
  createdAt: row.created_at,
  departmentId: row.department_id != null ? String(row.department_id) : undefined,
  departmentCode: row.department_code ?? undefined,
  departmentName: row.department_name ?? undefined,
  dpPaymentStatus: (row.dp_payment_status as DpPaymentStatus | null) ?? undefined,
  dpPaidAt: row.dp_paid_at ?? undefined,
  engagementId: row.engagement_id != null ? String(row.engagement_id) : undefined,
  leadId: row.lead_id != null ? String(row.lead_id) : undefined
});

export const mapApiProjectDetailToProject = (detail: ApiProjectDetail): Project => ({
  ...mapApiProjectListRowToProject(detail),
  consultants: (detail.consultants ?? []).map(mapConsultant),
  milestones: (detail.milestones ?? []).map(mapMilestone)
});
