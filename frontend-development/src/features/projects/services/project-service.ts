import type { Role } from '../../../app/permissions';
import type {
  Project,
  ProjectAssignee,
  ProjectConsultant,
  ProjectMilestoneStatus
} from '../types/project.types';
import { projectsApi } from './projects-api';
import {
  mapApiProjectDetailToProject,
  mapApiProjectListRowToProject
} from '../utils/map-api-project';

/**
 * Project service — full backend integration.
 *
 * Read-only (getAll, getById) + mutations (createFromHandover, assignConsultants,
 * setConsultants, updateMilestoneStatus, rateMilestone) semua hit backend real.
 */

export const projectService = {
  async getAll(): Promise<Project[]> {
    const rows = await projectsApi.list();
    return rows.map(mapApiProjectListRowToProject);
  },

  async getById(id: string): Promise<Project | undefined> {
    const detail = await projectsApi.getById(id);
    if (!detail) return undefined;
    return mapApiProjectDetailToProject(detail);
  },

  /**
   * COO action: spawn project dari handover APPROVED + assign PM. Backend
   * handle: validasi status, transaksi insert project + milestones, transition
   * handover ke ASSIGNED_TO_PM. `pm.id` HARUS numeric user id (string-encoded).
   */
  async createFromHandover(
    handoverId: string,
    pm: ProjectAssignee,
    _actor: { name: string; role: Role },
    note?: string
  ): Promise<Project> {
    const pmUserId = Number(pm.id);
    if (!Number.isInteger(pmUserId) || pmUserId <= 0) {
      throw new Error('PM user ID tidak valid (harus integer dari backend users).');
    }
    const detail = await projectsApi.createFromHandover(handoverId, {
      pmUserId,
      note
    });
    return mapApiProjectDetailToProject(detail);
  },

  /**
   * PM action: tambah consultant ke project. Backend validasi user role &
   * skip yang sudah ter-assign. `consultant.id` HARUS numeric user id
   * (string-encoded). Backend auto-transition project status ke 'In Progress'
   * kalau sebelumnya 'Awaiting Consultant'.
   */
  async assignConsultants(
    projectId: string,
    consultants: ProjectConsultant[],
    _actor: { name: string; role: Role },
    note?: string
  ): Promise<Project> {
    if (consultants.length === 0) {
      throw new Error('Pilih minimal satu consultant.');
    }
    const payloadItems = consultants.map((c) => {
      const userId = Number(c.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error(`Consultant ID tidak valid (harus integer dari backend users): ${c.id}`);
      }
      return { userId, level: c.level };
    });
    const detail = await projectsApi.assignConsultants(projectId, {
      consultants: payloadItems,
      note
    });
    return mapApiProjectDetailToProject(detail);
  },

  /**
   * PM action: REPLACE seluruh consultant list (edit mode). Backend hitung
   * diff (add/update-level/remove). Boleh kirim array kosong untuk hapus semua.
   */
  async setConsultants(
    projectId: string,
    consultants: ProjectConsultant[],
    _actor: { name: string; role: Role },
    note?: string
  ): Promise<Project> {
    const payloadItems = consultants.map((c) => {
      const userId = Number(c.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error(`Consultant ID tidak valid (harus integer dari backend users): ${c.id}`);
      }
      return { userId, level: c.level };
    });
    const detail = await projectsApi.setConsultants(projectId, {
      consultants: payloadItems,
      note
    });
    return mapApiProjectDetailToProject(detail);
  },

  /**
   * Consultant/PM action: update milestone status. Backend validasi actor
   * harus owner milestone atau PM project, lalu auto-log ke
   * project_milestone_updates (feed KPI Update Compliance).
   * `actor` ignored — backend pakai req.user dari JWT.
   */
  async updateMilestoneStatus(
    projectId: string,
    milestoneId: string,
    nextStatus: ProjectMilestoneStatus,
    _actor: { id: string; name: string },
    note?: string
  ): Promise<Project> {
    const detail = await projectsApi.updateMilestoneStatus(projectId, milestoneId, {
      status: nextStatus,
      note
    });
    return mapApiProjectDetailToProject(detail);
  },

  /**
   * PM action: rate milestone (1-5 + revision count). Feed KPI Output Quality.
   * Backend validate actor harus PM project. `pmActor` ignored — backend pakai
   * req.user dari JWT.
   */
  async rateMilestone(
    projectId: string,
    milestoneId: string,
    rating: 1 | 2 | 3 | 4 | 5,
    revisionCount: number,
    _pmActor: { id: string; name: string },
    note?: string
  ): Promise<Project> {
    const detail = await projectsApi.rateMilestone(projectId, milestoneId, {
      rating,
      revisionCount,
      note
    });
    return mapApiProjectDetailToProject(detail);
  },

  /**
   * PM action: mark project Completed. Backend validate semua milestone Done +
   * trigger ke modul Invoice (set term FINAL: DRAFT → READY_TO_ISSUE).
   * Return `triggeredInvoiceTerms` = jumlah term ke-trigger (0 kalau invoice
   * belum di-link project_id; admin invoice perlu cek).
   */
  async completeProject(
    projectId: string,
    note?: string
  ): Promise<{ project: Project; triggeredInvoiceTerms: number }> {
    const result = await projectsApi.completeProject(projectId, { note });
    return {
      project: mapApiProjectDetailToProject(result.project),
      triggeredInvoiceTerms: result.triggeredInvoiceTerms
    };
  }
};
