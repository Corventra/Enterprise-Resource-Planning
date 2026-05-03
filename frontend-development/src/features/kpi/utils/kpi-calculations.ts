import type { ProjectMilestone, TaskUpdateLogEntry } from '../../projects/types/project.types';
import { KPI_DIMENSION_KEYS, type KpiDimensionKey } from '../types/kpi.types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Parse period "YYYY-MM" jadi [startMs, endMs] inklusif. Return null kalau format
 * tidak valid (caller fallback ke "no period filter").
 */
const parsePeriodRange = (period: string): [number, number] | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return null;
  const yyyy = Number(match[1]);
  const mm = Number(match[2]);
  if (!yyyy || !mm) return null;
  const start = new Date(yyyy, mm - 1, 1).getTime();
  const end = new Date(yyyy, mm, 0, 23, 59, 59, 999).getTime();
  return [start, end];
};

/**
 * Tentukan apakah milestone "in scope" untuk satu period KPI:
 * - `completedAt` falls in period, ATAU
 * - ada updateLog entry yang fall in period
 *
 * Milestone tanpa aktivitas dalam period TIDAK dihitung untuk Task Completion
 * dimensi (denominator), Timeliness, atau Output Quality.
 */
export const isMilestoneInPeriod = (milestone: ProjectMilestone, period: string): boolean => {
  const range = parsePeriodRange(period);
  if (!range) return true;
  const [start, end] = range;

  if (milestone.completedAt) {
    const c = new Date(milestone.completedAt).getTime();
    if (!Number.isNaN(c) && c >= start && c <= end) return true;
  }
  return milestone.updateLog.some((entry) => {
    const t = new Date(entry.at).getTime();
    return !Number.isNaN(t) && t >= start && t <= end;
  });
};

/**
 * Filter updateLog entries hanya yang fall in period — dipakai oleh Update
 * Compliance dimension supaya gap antar entry hanya dihitung dalam range period.
 */
export const filterUpdateLogByPeriod = (
  log: TaskUpdateLogEntry[],
  period?: string
): TaskUpdateLogEntry[] => {
  if (!period) return log;
  const range = parsePeriodRange(period);
  if (!range) return log;
  const [start, end] = range;
  return log.filter((entry) => {
    const t = new Date(entry.at).getTime();
    return !Number.isNaN(t) && t >= start && t <= end;
  });
};

/**
 * Formula: Σ(weight × done) / Σ(weight) × 100%
 * Aligned dengan PRD Section 9.2 (benefit indicator).
 */
export const computeTaskCompletion = (milestones: ProjectMilestone[]): { capaian: number; rawValue: number } => {
  const totalWeight = milestones.reduce((sum, m) => sum + m.weight, 0);
  if (totalWeight === 0) return { capaian: 0, rawValue: 0 };
  const doneWeight = milestones
    .filter((m) => m.status === 'Done')
    .reduce((sum, m) => sum + m.weight, 0);
  const ratio = doneWeight / totalWeight;
  return { capaian: ratio * 100, rawValue: ratio };
};

/**
 * Formula: onTimeCount / totalDoneCount × 100% (benefit indicator).
 * "On time" = completedAt <= targetDate + onTimeToleranceDays.
 * Negative diff (selesai lebih awal) tetap on-time.
 */
export const computeTimeliness = (
  milestones: ProjectMilestone[],
  onTimeToleranceDays: number
): { capaian: number; rawValue: number } => {
  const doneMilestones = milestones.filter((m) => m.status === 'Done' && m.completedAt);
  if (doneMilestones.length === 0) return { capaian: 0, rawValue: 0 };
  const onTime = doneMilestones.filter((m) => {
    const target = new Date(m.targetDate).getTime();
    const completed = new Date(m.completedAt as string).getTime();
    if (Number.isNaN(target) || Number.isNaN(completed)) return false;
    const diffDays = (completed - target) / MS_PER_DAY;
    return diffDays <= onTimeToleranceDays;
  });
  const ratio = onTime.length / doneMilestones.length;
  return { capaian: ratio * 100, rawValue: ratio };
};

/**
 * Formula: targetGapDays / actualAvgGapDays × 100% (cost indicator, capped 100%).
 * Gap = selisih hari antar entry di updateLog. Membutuhkan minimal 2 entries
 * per milestone untuk berkontribusi.
 *
 * Edge case: jika tidak ada gap data sama sekali (semua milestone < 2 entries),
 * return 100% — diasumsikan compliant by default (no work to track).
 */
export const computeUpdateCompliance = (
  milestones: ProjectMilestone[],
  targetGapDays: number,
  period?: string
): { capaian: number; rawValue: number } => {
  const allGaps: number[] = [];
  milestones.forEach((m) => {
    const log = filterUpdateLogByPeriod(m.updateLog, period);
    for (let i = 1; i < log.length; i++) {
      const prev = new Date(log[i - 1].at).getTime();
      const curr = new Date(log[i].at).getTime();
      if (!Number.isNaN(prev) && !Number.isNaN(curr) && curr >= prev) {
        allGaps.push((curr - prev) / MS_PER_DAY);
      }
    }
  });
  if (allGaps.length === 0) return { capaian: 100, rawValue: 0 };
  const avgGap = allGaps.reduce((sum, g) => sum + g, 0) / allGaps.length;
  if (avgGap === 0) return { capaian: 100, rawValue: 0 };
  const capaian = Math.min(100, (targetGapDays / avgGap) * 100);
  return { capaian, rawValue: avgGap };
};

/**
 * Formula: avgRating / 5 × 100% (benefit indicator).
 * Hanya menghitung milestone yang punya `qualityRating`.
 */
export const computeOutputQuality = (
  milestones: ProjectMilestone[]
): { capaian: number; rawValue: number } => {
  const rated = milestones.filter((m) => m.qualityRating !== undefined);
  if (rated.length === 0) return { capaian: 0, rawValue: 0 };
  const sum = rated.reduce((acc, m) => acc + (m.qualityRating ?? 0), 0);
  const avg = sum / rated.length;
  return { capaian: (avg / 5) * 100, rawValue: avg };
};

/**
 * Formula tesis: KPI_total = Σ(w_i × c_i) dengan asumsi weights ternormalisasi
 * (Σw_i = 1). Kalau weights belum ternormalisasi, fungsi ini auto-normalize.
 */
export const computeKpiTotal = (
  weights: Record<KpiDimensionKey, number>,
  capaianByDimension: Record<KpiDimensionKey, number>
): number => {
  const totalWeight = KPI_DIMENSION_KEYS.reduce((sum, key) => sum + (weights[key] ?? 0), 0);
  if (totalWeight === 0) return 0;
  const numerator = KPI_DIMENSION_KEYS.reduce(
    (sum, key) => sum + (weights[key] ?? 0) * (capaianByDimension[key] ?? 0),
    0
  );
  return numerator / totalWeight;
};
