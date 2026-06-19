import { projectService } from '../../projects/services/project-service';
import type { ProjectAssignee } from '../../projects/types/project.types';
import {
  KPI_DIMENSION_KEYS,
  type KpiDimensionKey,
  type KpiDimensionScore,
  type KpiPeriodConfig,
  type KpiSnapshot,
  type ProjectKpiBreakdown
} from '../types/kpi.types';
import { aggregateAcrossProjects } from '../utils/kpi-aggregations';
import {
  computeKpiTotal,
  computeOutputQuality,
  computeTaskCompletion,
  computeTimeliness,
  computeUpdateCompliance,
  isMilestoneInPeriod
} from '../utils/kpi-calculations';
import { kpiConfigService } from './kpi-config-service';

const currentPeriodIso = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${yyyy}-${mm}`;
};

/**
 * KPI Engine — orchestrate komputasi snapshot dari raw project data.
 * Ini "the math" yang dirujuk PRD Section 9.6 tahap 4:
 *   "Sistem (auto): Engine: hitung c_i per dimensi → KPI_total → simpan ke KpiSnapshot"
 *
 * Tidak ada role yang menghitung manual — semua via engine ini.
 */
export const kpiEngine = {
  /**
   * Compute snapshot untuk satu consultant pada satu period.
   * Period filter di-apply: hanya milestone yang punya aktivitas (completedAt
   * atau updateLog entry) dalam period yang masuk scope. Lihat
   * `isMilestoneInPeriod` di kpi-calculations.ts.
   */
  async computeSnapshot(
    consultant: ProjectAssignee,
    period: string = currentPeriodIso(),
    config?: KpiPeriodConfig
  ): Promise<KpiSnapshot> {
    const cfg = config ?? (await kpiConfigService.getCurrent());
    const projects = await projectService.getAll();

    // Per project, ambil milestone yang ia owni & in-scope untuk period.
    const perProject: ProjectKpiBreakdown[] = projects
      .map((project) => {
        const owned = project.milestones
          .filter((m) => m.ownerId === consultant.id)
          .filter((m) => isMilestoneInPeriod(m, period));
        if (owned.length === 0) return null;
        const tc = computeTaskCompletion(owned);
        const tm = computeTimeliness(owned, cfg.onTimeToleranceDays);
        const uc = computeUpdateCompliance(owned, cfg.updateGapTargetDays, period);
        const oq = computeOutputQuality(owned);
        return {
          projectId: project.id,
          projectCode: project.projectCode,
          projectName: project.projectName,
          taskCount: owned.length,
          dimensions: {
            taskCompletion: tc.capaian,
            timeliness: tm.capaian,
            updateCompliance: uc.capaian,
            outputQuality: oq.capaian
          },
          contributingTaskIds: owned.map((m) => m.id)
        } as ProjectKpiBreakdown;
      })
      .filter((p): p is ProjectKpiBreakdown => p !== null);

    const aggregated = aggregateAcrossProjects(perProject);
    const total = computeKpiTotal(cfg.weights, aggregated);

    // Build per-dimension score with audit info
    const dimensions = KPI_DIMENSION_KEYS.reduce((acc, key) => {
      const contributingTaskIds = perProject.flatMap((p) => p.contributingTaskIds);
      const rawValue = perProject.length === 0
        ? 0
        : perProject.reduce(
            (sum, p) => sum + (p.taskCount * p.dimensions[key]) / 100,
            0
          ) /
          (perProject.reduce((sum, p) => sum + p.taskCount, 0) || 1);
      acc[key] = {
        weight: cfg.weights[key],
        capaian: aggregated[key],
        rawValue,
        contributingTaskIds
      };
      return acc;
    }, {} as Record<KpiDimensionKey, KpiDimensionScore>);

    return {
      consultantId: consultant.id,
      consultantName: consultant.name,
      period,
      computedAt: new Date().toISOString(),
      dimensions,
      total,
      contributingProjectIds: perProject.map((p) => p.projectId)
    };
  },
  /**
   * List unique consultants dari semua project — siapa yang punya KPI valid
   * untuk dihitung di period ini.
   */
  async listAllConsultants(): Promise<ProjectAssignee[]> {
    // ?withConsultants=1: backend ikut sertakan array consultant per project,
    // jadi engine bisa derive daftar konsultan tanpa N+1 fetch detail.
    const projects = await projectService.getAll({ withConsultants: true });
    const seen = new Map<string, ProjectAssignee>();
    projects.forEach((p) => {
      p.consultants.forEach((c) => {
        if (!seen.has(c.id)) {
          seen.set(c.id, { id: c.id, name: c.name });
        }
      });
    });
    return Array.from(seen.values());
  },
  /**
   * Compute snapshot untuk SEMUA consultant pada satu period.
   */
  async computeAllForPeriod(period: string = currentPeriodIso()): Promise<KpiSnapshot[]> {
    const consultants = await kpiEngine.listAllConsultants();
    return Promise.all(consultants.map((c) => kpiEngine.computeSnapshot(c, period)));
  },
  /**
   * Per-project breakdown untuk drill-down di UI dashboard.
   */
  async getProjectBreakdown(
    consultant: ProjectAssignee,
    config?: KpiPeriodConfig
  ): Promise<ProjectKpiBreakdown[]> {
    const cfg = config ?? (await kpiConfigService.getCurrent());
    const projects = await projectService.getAll();
    return projects
      .map((project) => {
        const owned = project.milestones.filter((m) => m.ownerId === consultant.id);
        if (owned.length === 0) return null;
        const tc = computeTaskCompletion(owned);
        const tm = computeTimeliness(owned, cfg.onTimeToleranceDays);
        const uc = computeUpdateCompliance(owned, cfg.updateGapTargetDays);
        const oq = computeOutputQuality(owned);
        return {
          projectId: project.id,
          projectCode: project.projectCode,
          projectName: project.projectName,
          taskCount: owned.length,
          dimensions: {
            taskCompletion: tc.capaian,
            timeliness: tm.capaian,
            updateCompliance: uc.capaian,
            outputQuality: oq.capaian
          },
          contributingTaskIds: owned.map((m) => m.id)
        } as ProjectKpiBreakdown;
      })
      .filter((p): p is ProjectKpiBreakdown => p !== null);
  }
};
