export type ProjectStatus =
  | 'Awaiting Consultant'
  | 'In Progress'
  | 'On Hold'
  | 'Completed'
  | 'Cancelled';

export type ProjectMilestoneStatus = 'Pending' | 'In Progress' | 'Done' | 'Blocked';

export type ProjectMilestonePhase = 'Initiation' | 'Analysis' | 'Core Work' | 'QC' | 'Delivery';

export type ConsultantLevel = 'Lead' | 'Senior' | 'Junior';

export type ProjectServiceLine = 'Transfer Pricing' | 'Tax' | 'Advisory' | 'Audit';

export interface ProjectAssignee {
  /** Use the user's email as a stable id for now (matches dummy auth). */
  id: string;
  name: string;
}

export interface ProjectConsultant extends ProjectAssignee {
  level: ConsultantLevel;
}

/**
 * Append-only log entry for a milestone status change. Feeds the KPI
 * "Update Compliance" dimension (gap antar entry).
 */
export interface TaskUpdateLogEntry {
  at: string;
  byId: string;
  byName: string;
  fromStatus: ProjectMilestoneStatus;
  toStatus: ProjectMilestoneStatus;
  note?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  targetDate: string;
  status: ProjectMilestoneStatus;
  ownerId: string;
  ownerName: string;
  notes?: string;
  /** KPI weight (typical range 1–50). Sum across milestones in a project usually = 100. */
  weight: number;
  phase?: ProjectMilestonePhase;
  /** ISO. Auto-set when status transitions to 'Done'; cleared if status moves back. */
  completedAt?: string;
  /** PM-set when approving task to Done. Feeds KPI "Output Quality" dimension. */
  qualityRating?: 1 | 2 | 3 | 4 | 5;
  revisionCount?: number;
  /** Append-only audit log of status transitions. Feeds KPI "Update Compliance". */
  updateLog: TaskUpdateLogEntry[];
}

/**
 * Definition of a single task in a TaskTemplate — used to spawn ProjectMilestone
 * entries when COO converts a handover to a project.
 */
export interface TaskTemplateTask {
  title: string;
  weight: number;
  phase?: ProjectMilestonePhase;
  expectedDurationDays: number;
}

export interface TaskTemplate {
  id: string;
  serviceLine: ProjectServiceLine;
  name: string;
  isDefault: boolean;
  tasks: TaskTemplateTask[];
}

/**
 * DP payment status — dibaca dari `handovers.dp_payment_status` yang di-maintain
 * modul Invoice (Izhhar). Cross-module integration rule (PRD Rule A): project
 * tidak boleh "mulai" sebelum DP PAID — frontend pakai field ini untuk disable
 * action button + show banner di team page.
 */
export type DpPaymentStatus = 'UNPAID' | 'PAID';

export interface Project {
  id: string;
  projectCode: string;
  handoverId: string;
  client: string;
  projectName: string;
  serviceLine: ProjectServiceLine;
  status: ProjectStatus;
  pm: ProjectAssignee | null;
  consultants: ProjectConsultant[];
  startDate: string;
  endDate: string;
  milestones: ProjectMilestone[];
  createdAt: string;
  /** Department asal project (inherit dari handover). Dipakai untuk filter
   * consultant picker — hanya consultant yang termasuk department ini boleh
   * di-assign. Optional untuk kompat data lama tanpa department. */
  departmentId?: string;
  departmentCode?: string;
  departmentName?: string;
  /** DP payment status dari handover (source of truth: modul Invoice).
   * Null kalau handover belum punya invoice term DP (data legacy). */
  dpPaymentStatus?: DpPaymentStatus;
  dpPaidAt?: string;
  /** Linkage IDs untuk modul invoice (optional, untuk audit/debug). */
  engagementId?: string;
  leadId?: string;
}

export interface ProjectFilters {
  search: string;
  status: ProjectStatus | 'All';
  serviceLine: ProjectServiceLine | 'All';
}

export const PROJECT_STATUS_OPTIONS: readonly ProjectStatus[] = [
  'Awaiting Consultant',
  'In Progress',
  'On Hold',
  'Completed',
  'Cancelled'
] as const;

/**
 * Tailwind class map for status badges. Mirror of `handoverStatusStyleMap`
 * pattern — single source of truth, components consume this.
 */
export const projectStatusStyleMap: Record<ProjectStatus, string> = {
  'Awaiting Consultant': 'bg-amber-100 text-[#a16207]',
  'In Progress': 'bg-[#d5e3fc] text-[#003c90]',
  'On Hold': 'bg-[#e0e3e5] text-[#434653]',
  Completed: 'bg-[#006544]/15 text-[#006544]',
  Cancelled: 'bg-orange-100 text-[#c2410c]'
};

export const projectMilestoneStatusStyleMap: Record<ProjectMilestoneStatus, string> = {
  Pending: 'bg-[#e0e3e5] text-[#434653]',
  'In Progress': 'bg-[#d5e3fc] text-[#003c90]',
  Done: 'bg-[#006544]/15 text-[#006544]',
  Blocked: 'bg-orange-100 text-[#c2410c]'
};
