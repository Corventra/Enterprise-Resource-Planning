import type { Role } from '../../../app/permissions';
import { handoverService } from '../../handover/services/handover-service';
import { projectsMock } from '../mocks/projects.mock';
import type {
  Project,
  ProjectAssignee,
  ProjectConsultant,
  ProjectMilestone,
  ProjectMilestoneStatus
} from '../types/project.types';
import { taskTemplateService } from './task-template-service';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const projectStore: Project[] = clone(projectsMock);

const generateProjectCode = (): string => {
  const year = new Date().getFullYear();
  const seq = (projectStore.length + 1).toString().padStart(4, '0');
  return `PRJ-${year}-${seq}`;
};

const addMonths = (base: Date, months: number): Date => {
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
};

export const projectService = {
  async getAll(): Promise<Project[]> {
    return clone(projectStore);
  },
  async getById(id: string): Promise<Project | undefined> {
    const found = projectStore.find((entry) => entry.id === id);
    return found ? clone(found) : undefined;
  },
  async getByHandoverId(handoverId: string): Promise<Project | undefined> {
    const found = projectStore.find((entry) => entry.handoverId === handoverId);
    return found ? clone(found) : undefined;
  },
  /**
   * COO action: spawn a Project from an Approved handover and transition the
   * handover to `Assigned to PM`. Returns the created project.
   */
  async createFromHandover(
    handoverId: string,
    pm: ProjectAssignee,
    actor: { name: string; role: Role },
    note?: string
  ): Promise<Project> {
    const handoverItem = await handoverService.getItemById(handoverId);
    if (!handoverItem) {
      throw new Error(`Handover ${handoverId} not found`);
    }
    if (handoverItem.status !== 'Approved') {
      throw new Error(`Handover ${handoverId} is not in Approved status (current: ${handoverItem.status})`);
    }
    const today = new Date();
    const startIso = today.toISOString().slice(0, 10);
    const projectIdSuffix = `${Date.now()}`;

    // Spawn milestones dari TaskTemplate per service line. Kalau template tidak
    // ada (mis. service line baru), fallback ke handover.timelineMilestones biar
    // tidak gagal — tapi default-nya selalu pakai template (KPI-friendly).
    const template = await taskTemplateService.getDefaultByServiceLine(
      handoverItem.serviceLine as import('../types/project.types').ProjectServiceLine
    );
    let milestones: ProjectMilestone[];
    if (template) {
      milestones = taskTemplateService.cloneAsMilestones(template, startIso, pm, `mil-${projectIdSuffix}`);
    } else {
      const handoverDetail = await handoverService.getById(handoverId);
      milestones = (handoverDetail?.timelineMilestones ?? []).map((m, idx) => ({
        id: `mil-${projectIdSuffix}-${idx + 1}`,
        title: m.milestone,
        weight: 10,
        targetDate: m.targetDate,
        status: 'Pending',
        ownerId: pm.id,
        ownerName: pm.name,
        notes: m.notes,
        updateLog: []
      }));
    }

    const newProject: Project = {
      id: `prj-${projectIdSuffix}`,
      projectCode: generateProjectCode(),
      handoverId,
      client: handoverItem.client,
      projectName: handoverItem.project,
      serviceLine: handoverItem.serviceLine as import('../types/project.types').ProjectServiceLine,
      status: 'Awaiting Consultant',
      pm,
      consultants: [],
      startDate: startIso,
      endDate: addMonths(today, 6).toISOString().slice(0, 10),
      milestones,
      createdAt: today.toISOString()
    };
    projectStore.push(newProject);

    const trailNote = note ? `Assigned to ${pm.name}. ${note}` : `Assigned to ${pm.name}`;
    await handoverService.assignPM(handoverId, actor, trailNote);

    return clone(newProject);
  },
  /**
   * PM action: append one or more consultants to a project. If the project was
   * `Awaiting Consultant`, transitions to `In Progress` and updates the linked
   * handover trail with `consultantAssigned`.
   */
  async assignConsultants(
    projectId: string,
    consultants: ProjectConsultant[],
    actor: { name: string; role: Role },
    note?: string
  ): Promise<Project> {
    const project = projectStore.find((entry) => entry.id === projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }
    if (consultants.length === 0) {
      throw new Error('Pilih minimal satu consultant.');
    }

    const existingIds = new Set(project.consultants.map((c) => c.id));
    const fresh = consultants.filter((c) => !existingIds.has(c.id));
    if (fresh.length === 0) {
      throw new Error('Consultant yang dipilih sudah ter-assign di project ini.');
    }
    project.consultants = [...project.consultants, ...fresh];

    if (project.status === 'Awaiting Consultant') {
      project.status = 'In Progress';
      await handoverService.appendTrailEntry(
        project.handoverId,
        'projectStarted',
        actor,
        `Project ${project.projectCode} dimulai dengan ${fresh.length} consultant.`
      );
    }

    const summary = fresh.map((c) => `${c.name} (${c.level})`).join(', ');
    const trailNote = note ? `${summary}. ${note}` : summary;
    await handoverService.appendTrailEntry(project.handoverId, 'consultantAssigned', actor, trailNote);

    return clone(project);
  },
  /**
   * Mutate a milestone's status with audit logging. Auto-sets `completedAt`
   * when transitioning to 'Done', clears it on transition away from 'Done'.
   * Always appends to `updateLog`. Used by Consultant (status updates) and PM
   * (when approving — combine with rate via `rateMilestone`).
   */
  async updateMilestoneStatus(
    projectId: string,
    milestoneId: string,
    nextStatus: ProjectMilestoneStatus,
    actor: { id: string; name: string },
    note?: string
  ): Promise<Project> {
    const project = projectStore.find((entry) => entry.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);
    const milestone = project.milestones.find((m) => m.id === milestoneId);
    if (!milestone) throw new Error(`Milestone ${milestoneId} not found in project ${projectId}`);

    const fromStatus = milestone.status;
    if (fromStatus === nextStatus) return clone(project);

    milestone.status = nextStatus;
    if (nextStatus === 'Done') {
      milestone.completedAt = milestone.completedAt ?? new Date().toISOString();
    } else if (fromStatus === 'Done') {
      milestone.completedAt = undefined;
    }
    milestone.updateLog = [
      ...milestone.updateLog,
      {
        at: new Date().toISOString(),
        byId: actor.id,
        byName: actor.name,
        fromStatus,
        toStatus: nextStatus,
        note
      }
    ];

    return clone(project);
  },
  /**
   * PM action: attach a quality rating + revision count when approving a task.
   * Typically called together with `updateMilestoneStatus(... 'Done' ...)`.
   */
  async rateMilestone(
    projectId: string,
    milestoneId: string,
    rating: 1 | 2 | 3 | 4 | 5,
    revisionCount: number,
    pmActor: { id: string; name: string },
    note?: string
  ): Promise<Project> {
    const project = projectStore.find((entry) => entry.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);
    const milestone = project.milestones.find((m) => m.id === milestoneId);
    if (!milestone) throw new Error(`Milestone ${milestoneId} not found in project ${projectId}`);

    milestone.qualityRating = rating;
    milestone.revisionCount = revisionCount;
    milestone.updateLog = [
      ...milestone.updateLog,
      {
        at: new Date().toISOString(),
        byId: pmActor.id,
        byName: pmActor.name,
        fromStatus: milestone.status,
        toStatus: milestone.status,
        note: note ? `Rated ${rating}/5 (revisions: ${revisionCount}). ${note}` : `Rated ${rating}/5 (revisions: ${revisionCount}).`
      }
    ];

    return clone(project);
  }
};
