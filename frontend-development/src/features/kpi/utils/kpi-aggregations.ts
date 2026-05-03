import { KPI_DIMENSION_KEYS, type KpiDimensionKey, type ProjectKpiBreakdown } from '../types/kpi.types';

/**
 * Cross-project aggregation per PRD Section 9.7:
 *   ConsultantKpi_dim = Σ(taskCount_P × dim_P) / Σ(taskCount_P)
 *
 * Project dengan workload lebih besar memberi bobot lebih besar — konsultan
 * tidak di-penalize karena project kecil ber-tempo lambat saat project besar
 * berjalan baik.
 */
export const aggregateAcrossProjects = (
  perProject: ProjectKpiBreakdown[]
): Record<KpiDimensionKey, number> => {
  const result: Record<KpiDimensionKey, number> = {
    taskCompletion: 0,
    timeliness: 0,
    updateCompliance: 0,
    outputQuality: 0
  };

  const totalTasks = perProject.reduce((sum, p) => sum + p.taskCount, 0);
  if (totalTasks === 0) return result;

  perProject.forEach((p) => {
    const projectWeight = p.taskCount / totalTasks;
    KPI_DIMENSION_KEYS.forEach((key) => {
      result[key] += projectWeight * (p.dimensions[key] ?? 0);
    });
  });

  return result;
};
