import type { Role } from '../../../app/permissions';
import { taskTemplatesMock } from '../mocks/task-templates.mock';
import type {
  ProjectAssignee,
  ProjectMilestone,
  ProjectServiceLine,
  TaskTemplate
} from '../types/project.types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const STORAGE_KEY = 'erp_task_templates';

const loadFromStorage = (): TaskTemplate[] => {
  try {
    if (typeof window === 'undefined') return clone(taskTemplatesMock);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(taskTemplatesMock);
    const parsed = JSON.parse(raw) as TaskTemplate[];
    if (!Array.isArray(parsed)) return clone(taskTemplatesMock);
    return parsed;
  } catch {
    return clone(taskTemplatesMock);
  }
};

const persist = (data: TaskTemplate[]) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    /* ignore */
  }
};

const templateStore: TaskTemplate[] = loadFromStorage();

const addDays = (base: Date, days: number): Date => {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
};

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

export const taskTemplateService = {
  async getAll(): Promise<TaskTemplate[]> {
    return clone(templateStore);
  },
  async getById(id: string): Promise<TaskTemplate | undefined> {
    const found = templateStore.find((t) => t.id === id);
    return found ? clone(found) : undefined;
  },
  /**
   * Returns the default template for a given service line, or undefined if
   * none exists. Used when COO assigns PM to a handover and we need to spawn
   * the project's task list.
   */
  async getDefaultByServiceLine(serviceLine: ProjectServiceLine): Promise<TaskTemplate | undefined> {
    const found = templateStore.find((t) => t.serviceLine === serviceLine && t.isDefault);
    return found ? clone(found) : undefined;
  },
  /**
   * Materialize a TaskTemplate into ProjectMilestone[] for a brand-new project.
   * - targetDate dihitung running dari startDate berdasarkan expectedDurationDays
   * - status default 'Pending', updateLog kosong, owner = PM yang di-assign
   */
  /**
   * CEO + COO collaborative action: update a task template. For MVP semua role
   * dengan TASK_TEMPLATE_MANAGE bisa langsung simpan. Audit info akan
   * di-tampilkan di UI dari `_actor` di v2.
   */
  async update(next: TaskTemplate, _actor: { id: string; name: string; role: Role }): Promise<TaskTemplate> {
    const idx = templateStore.findIndex((t) => t.id === next.id);
    if (idx >= 0) {
      templateStore[idx] = clone(next);
      persist(templateStore);
      return clone(templateStore[idx]);
    }
    templateStore.push(clone(next));
    persist(templateStore);
    return clone(next);
  },
  async resetToMock(): Promise<void> {
    templateStore.splice(0, templateStore.length, ...clone(taskTemplatesMock));
    persist(templateStore);
  },
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
