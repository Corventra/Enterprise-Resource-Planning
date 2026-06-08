import type { Role } from '../../../app/permissions';
import { apiGet, apiPut } from '../../../services/api-client';
import type {
  ProjectAssignee,
  ProjectMilestone,
  ProjectMilestonePhase,
  ProjectServiceLine,
  TaskTemplate,
  TaskTemplateTask
} from '../types/project.types';

/**
 * Task Template service — full backend integration.
 *
 * Endpoints:
 *   - GET    /api/task-templates                           — list
 *   - GET    /api/task-templates/:templateId               — detail
 *   - GET    /api/task-templates/default/:serviceLine      — default per SL
 *   - PUT    /api/task-templates/:templateId               — update (replace tasks)
 */

interface ApiTaskTemplateTask {
  task_id: number;
  title: string;
  weight: number;
  phase: string | null;
  expected_duration_days: number;
  sequence_no: number;
}

interface ApiTaskTemplate {
  template_id: number;
  service_line: string;
  name: string;
  is_default: 0 | 1;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  tasks: ApiTaskTemplateTask[];
}

interface ListResponse {
  success: boolean;
  data: { items: ApiTaskTemplate[] };
}

interface SingleResponse {
  success: boolean;
  data: { template: ApiTaskTemplate };
}

const mapTask = (row: ApiTaskTemplateTask): TaskTemplateTask => ({
  title: row.title,
  weight: row.weight,
  phase: (row.phase as ProjectMilestonePhase | null) ?? undefined,
  expectedDurationDays: row.expected_duration_days
});

const mapTemplate = (row: ApiTaskTemplate): TaskTemplate => ({
  id: String(row.template_id),
  serviceLine: row.service_line as ProjectServiceLine,
  name: row.name,
  isDefault: row.is_default === 1,
  tasks: (row.tasks ?? []).map(mapTask)
});

const addDays = (base: Date, days: number): Date => {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
};

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

export const taskTemplateService = {
  async getAll(): Promise<TaskTemplate[]> {
    const res = await apiGet<ListResponse>('/task-templates');
    return res.data.items.map(mapTemplate);
  },

  async getById(id: string): Promise<TaskTemplate | undefined> {
    try {
      const res = await apiGet<SingleResponse>(`/task-templates/${encodeURIComponent(id)}`);
      return mapTemplate(res.data.template);
    } catch (e) {
      const status = (e as { status?: number })?.status;
      if (status === 404) return undefined;
      throw e;
    }
  },

  /**
   * Default template per service line. Backend lookup `is_default = 1` row.
   * Return undefined kalau backend 404 (belum ada default — caller fallback ke
   * handover.milestones).
   */
  async getDefaultByServiceLine(serviceLine: ProjectServiceLine): Promise<TaskTemplate | undefined> {
    try {
      const res = await apiGet<SingleResponse>(
        `/task-templates/default/${encodeURIComponent(serviceLine)}`
      );
      return mapTemplate(res.data.template);
    } catch (e) {
      const status = (e as { status?: number })?.status;
      if (status === 404) return undefined;
      throw e;
    }
  },

  /**
   * CEO/COO/Superadmin (TASK_TEMPLATE_MANAGE) action: simpan template.
   * Backend replace seluruh `tasks` array dalam transaksi (DELETE + INSERT).
   * `_actor` ignored — backend pakai req.user dari JWT.
   */
  async update(next: TaskTemplate, _actor: { id: string; name: string; role: Role }): Promise<TaskTemplate> {
    void _actor;
    const payload = {
      name: next.name,
      tasks: next.tasks.map((t) => ({
        title: t.title,
        weight: t.weight,
        phase: t.phase ?? null,
        expectedDurationDays: t.expectedDurationDays
      }))
    };
    const res = await apiPut<SingleResponse>(
      `/task-templates/${encodeURIComponent(next.id)}`,
      payload
    );
    return mapTemplate(res.data.template);
  },

  /**
   * Materialize TaskTemplate jadi ProjectMilestone[] (utility client-side).
   * Tidak dipakai oleh backend flow `createFromHandover` (yang copy dari
   * handover_milestones), tapi tersedia untuk caller yang butuh preview.
   */
  cloneAsMilestones(
    template: TaskTemplate,
    startDate: string,
    defaultOwner: ProjectAssignee,
    idPrefix: string
  ): ProjectMilestone[] {
    let cursor = new Date(startDate);
    if (Number.isNaN(cursor.getTime())) cursor = new Date();

    return template.tasks.map((task, idx) => {
      cursor = addDays(cursor, task.expectedDurationDays);
      return {
        id: `${idPrefix}-${idx + 1}`,
        title: task.title,
        weight: task.weight,
        phase: task.phase,
        targetDate: toIsoDate(cursor),
        status: 'Pending',
        ownerId: defaultOwner.id,
        ownerName: defaultOwner.name,
        updateLog: []
      } satisfies ProjectMilestone;
    });
  }
};
