import type { Role } from '../../../app/permissions';

export type KpiDimensionKey =
  | 'taskCompletion'
  | 'timeliness'
  | 'updateCompliance'
  | 'outputQuality';

export const KPI_DIMENSION_KEYS: readonly KpiDimensionKey[] = [
  'taskCompletion',
  'timeliness',
  'updateCompliance',
  'outputQuality'
] as const;

export const KPI_DIMENSION_LABELS: Record<KpiDimensionKey, string> = {
  taskCompletion: 'Task Completion',
  timeliness: 'Timeliness',
  updateCompliance: 'Update Compliance',
  outputQuality: 'Output Quality'
};

export const KPI_DIMENSION_DESCRIPTIONS: Record<KpiDimensionKey, string> = {
  taskCompletion: 'Persentase task selesai (weighted) — Σ(weight × done) / Σ(weight)',
  timeliness: 'Persentase task selesai tepat waktu (≤ tolerance dari targetDate)',
  updateCompliance: 'Kepatuhan update progress — target gap / actual avg gap',
  outputQuality: 'Rata-rata rating PM dari task selesai (skala 1–5 → %)'
};

export const KPI_DIMENSION_TYPE: Record<KpiDimensionKey, 'benefit' | 'cost'> = {
  taskCompletion: 'benefit',
  timeliness: 'benefit',
  updateCompliance: 'cost',
  outputQuality: 'benefit'
};

/**
 * Skor satu dimensi KPI untuk satu consultant dalam satu period.
 * `weight` = bobot ternormalisasi (0..1), `capaian` = nilai 0..100, `rawValue` =
 * raw metric (mis. 5/7 untuk timeliness atau 4.2 untuk avg rating).
 */
export interface KpiDimensionScore {
  weight: number;
  capaian: number;
  rawValue: number;
  contributingTaskIds: string[];
}

/**
 * Hasil agregat KPI consultant untuk satu period (default monthly).
 * `finalizedAt` null = preliminary (live, masih bisa berubah).
 * `finalizedAt` ada = locked oleh HRD/CEO, immutable.
 */
export interface KpiSnapshot {
  consultantId: string;
  consultantName: string;
  period: string;
  computedAt: string;
  finalizedAt?: string;
  finalizedBy?: { id: string; name: string; role: Role };
  dimensions: Record<KpiDimensionKey, KpiDimensionScore>;
  /** KPI total 0..100 dari Σ(w_i × c_i). */
  total: number;
  contributingProjectIds: string[];
}

/**
 * Konfigurasi periode KPI: bobot dimensi, threshold, periode.
 * HRD primary edit. CEO approve untuk perubahan major (mis. ubah bobot dimensi).
 */
export interface KpiPeriodConfig {
  effectiveFrom: string;
  weights: Record<KpiDimensionKey, number>;
  onTimeToleranceDays: number;
  updateGapTargetDays: number;
  qualityRatingScale: 5;
  period: 'monthly' | 'quarterly';
  approvedBy?: { id: string; name: string; role: Role };
  approvedAt?: string;
}

/** Per-project KPI breakdown — used internally by aggregation logic. */
export interface ProjectKpiBreakdown {
  projectId: string;
  projectCode: string;
  projectName: string;
  taskCount: number;
  dimensions: Record<KpiDimensionKey, number>;
  contributingTaskIds: string[];
}
