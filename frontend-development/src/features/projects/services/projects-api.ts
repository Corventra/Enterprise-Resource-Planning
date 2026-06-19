import { apiGet, apiPatch, apiPost, apiPut } from '../../../services/api-client';

/**
 * Thin API client untuk projects backend. Caller (project-service.ts) bertugas
 * mapping payload backend ke shape frontend lewat `map-api-project.ts`.
 *
 * Phase 1: hanya 2 endpoint read-only (list + detail). Endpoint mutasi
 * (createFromHandover, assignConsultants, milestone update) ditambah di
 * phase berikutnya.
 */

export interface ApiProjectListRow {
  project_id: number;
  project_code: string;
  handover_id: number;
  client: string;
  project_name: string;
  service_line: string;
  status: string;
  pm_user_id: number | null;
  pm_name: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  department_id: number | null;
  department_code: string | null;
  department_name: string | null;
  // Cross-module dari handover (modul Invoice — Izhhar).
  dp_payment_status: 'UNPAID' | 'PAID' | null;
  dp_paid_at: string | null;
  engagement_id: number | null;
  lead_id: number | null;
  // Opsional: terisi kalau caller pakai ?withConsultants=1
  consultants?: ApiProjectConsultant[];
}

export interface ApiProjectMilestoneUpdate {
  update_id: number;
  milestone_id: number;
  by_user_id: number | null;
  by_name: string | null;
  from_status: string;
  to_status: string;
  note: string | null;
  at: string;
}

export interface ApiProjectMilestone {
  milestone_id: number;
  title: string;
  notes: string | null;
  target_date: string;
  status: string;
  owner_user_id: number | null;
  owner_name: string | null;
  weight: number;
  phase: string | null;
  sequence_no: number;
  completed_at: string | null;
  quality_rating: number | null;
  revision_count: number | null;
  updates: ApiProjectMilestoneUpdate[];
}

export interface ApiProjectConsultant {
  consultant_user_id: number;
  consultant_name: string | null;
  level: string;
  assigned_at: string;
}

export interface ApiProjectDetail extends ApiProjectListRow {
  consultants: ApiProjectConsultant[];
  milestones: ApiProjectMilestone[];
}

interface ListResponse {
  success: boolean;
  data: { items: ApiProjectListRow[] };
}

interface DetailResponse {
  success: boolean;
  data: { project: ApiProjectDetail };
}

export interface ApiLookupUser {
  id: number;
  name: string;
  email: string;
  role_code: string;
}

interface UsersLookupResponse {
  users: ApiLookupUser[];
}

export interface CreateFromHandoverPayload {
  pmUserId: number;
  note?: string;
}

export interface AssignConsultantPayload {
  consultants: Array<{ userId: number; level: 'Lead' | 'Senior' | 'Junior' }>;
  note?: string;
}

export interface UpdateMilestoneStatusPayload {
  status: 'Pending' | 'In Progress' | 'Done' | 'Blocked';
  note?: string;
}

export interface RateMilestonePayload {
  rating: 1 | 2 | 3 | 4 | 5;
  revisionCount: number;
  note?: string;
}

export interface CompleteProjectPayload {
  note?: string;
}

export interface CompleteProjectResult {
  project: ApiProjectDetail;
  /** Jumlah invoice term FINAL yang ke-trigger ke READY_TO_ISSUE. 0 berarti
   * invoice belum di-link (project_id NULL) — admin invoice perlu cek. */
  triggeredInvoiceTerms: number;
}

/**
 * Combined WFMS audit trail row (project-level transition + milestone-level
 * update merged). Untuk milestone, `entity_label` = title milestone; untuk
 * project, `entity_label` = null.
 *
 * `from_status` bisa null hanya pada baris project-level untuk event creation
 * (initial transition dari "tidak ada" ke 'Awaiting Consultant').
 */
export interface ApiAuditTrailEntry {
  id: number;
  entity_type: 'project' | 'milestone';
  entity_label: string | null;
  from_status: string | null;
  to_status: string;
  by_user_id: number | null;
  by_name: string | null;
  trigger_source: 'USER' | 'SYSTEM';
  triggered_at: string;
  reason: string | null;
}

interface AuditTrailResponse {
  success: boolean;
  data: {
    project_id: number;
    transitions: ApiAuditTrailEntry[];
  };
}

export const projectsApi = {
  list: async (options?: { withConsultants?: boolean }): Promise<ApiProjectListRow[]> => {
    const qs = options?.withConsultants ? '?withConsultants=1' : '';
    const res = await apiGet<ListResponse>(`/projects${qs}`);
    return res.data.items;
  },
  getById: async (projectId: string | number): Promise<ApiProjectDetail | null> => {
    try {
      const res = await apiGet<DetailResponse>(`/projects/${projectId}`);
      return res.data.project;
    } catch (e) {
      // 404 dari backend → return null supaya caller (service) gampang treat.
      // Error lain biarkan throw.
      const status = (e as { status?: number })?.status;
      if (status === 404) return null;
      throw e;
    }
  },
  createFromHandover: async (
    handoverId: string | number,
    payload: CreateFromHandoverPayload
  ): Promise<ApiProjectDetail> => {
    const res = await apiPost<DetailResponse>(
      `/projects/from-handover/${handoverId}`,
      payload
    );
    return res.data.project;
  },
  assignConsultants: async (
    projectId: string | number,
    payload: AssignConsultantPayload
  ): Promise<ApiProjectDetail> => {
    const res = await apiPost<DetailResponse>(
      `/projects/${projectId}/consultants`,
      payload
    );
    return res.data.project;
  },
  /**
   * REPLACE seluruh consultant list project. Backend hitung diff dan apply
   * (add/update-level/remove). Dipakai untuk dialog edit mode.
   */
  setConsultants: async (
    projectId: string | number,
    payload: AssignConsultantPayload
  ): Promise<ApiProjectDetail> => {
    const res = await apiPut<DetailResponse>(
      `/projects/${projectId}/consultants`,
      payload
    );
    return res.data.project;
  },
  /**
   * Consultant/PM action: update milestone status. Backend audit log otomatis.
   */
  updateMilestoneStatus: async (
    projectId: string | number,
    milestoneId: string | number,
    payload: UpdateMilestoneStatusPayload
  ): Promise<ApiProjectDetail> => {
    const res = await apiPatch<DetailResponse>(
      `/projects/${projectId}/milestones/${milestoneId}/status`,
      payload
    );
    return res.data.project;
  },
  /**
   * PM action: rate milestone yang sudah Done. Feed KPI Output Quality.
   */
  rateMilestone: async (
    projectId: string | number,
    milestoneId: string | number,
    payload: RateMilestonePayload
  ): Promise<ApiProjectDetail> => {
    const res = await apiPatch<DetailResponse>(
      `/projects/${projectId}/milestones/${milestoneId}/rate`,
      payload
    );
    return res.data.project;
  },
  /**
   * PM action: mark project Completed + trigger final invoice ke READY_TO_ISSUE
   * (cross-module integration dengan modul Invoice).
   */
  completeProject: async (
    projectId: string | number,
    payload: CompleteProjectPayload = {}
  ): Promise<CompleteProjectResult> => {
    const res = await apiPost<{ success: boolean; data: CompleteProjectResult }>(
      `/projects/${projectId}/complete`,
      payload
    );
    return res.data;
  },
  /**
   * Fetch WFMS combined audit trail (project + milestone transitions) sorted
   * kronologis ascending. Dipakai di tab Timeline (section Lifecycle History).
   */
  getAuditTrail: async (projectId: string | number): Promise<ApiAuditTrailEntry[]> => {
    const res = await apiGet<AuditTrailResponse>(`/projects/${projectId}/audit-trail`);
    return res.data.transitions;
  },
  /**
   * Phase 3 lifecycle endpoints — pause / resume / cancel. Semua menghasilkan
   * row di project_status_transitions (audit trail).
   *
   * - pause   : In Progress → On Hold (reason required)
   * - resume  : On Hold → In Progress (reason optional; WFMS re-check DP PAID)
   * - cancel  : * → Cancelled (reason required; CEO/COO only)
   */
  pauseProject: async (
    projectId: string | number,
    reason: string
  ): Promise<ApiProjectDetail> => {
    const res = await apiPost<DetailResponse>(`/projects/${projectId}/pause`, { reason });
    return res.data.project;
  },
  resumeProject: async (
    projectId: string | number,
    reason?: string
  ): Promise<ApiProjectDetail> => {
    const res = await apiPost<DetailResponse>(`/projects/${projectId}/resume`, { reason });
    return res.data.project;
  },
  cancelProject: async (
    projectId: string | number,
    reason: string
  ): Promise<ApiProjectDetail> => {
    const res = await apiPost<DetailResponse>(`/projects/${projectId}/cancel`, { reason });
    return res.data.project;
  },
  listUsersByRole: async (
    roleCode: string,
    opts: { departmentId?: number | string } = {}
  ): Promise<ApiLookupUser[]> => {
    const params = new URLSearchParams({ role: roleCode });
    if (opts.departmentId !== undefined && opts.departmentId !== null && opts.departmentId !== '') {
      params.set('departmentId', String(opts.departmentId));
    }
    const res = await apiGet<UsersLookupResponse>(`/lookup/users?${params.toString()}`);
    return res.users;
  }
};
