import type { KpiPeriodConfig } from '../types/kpi.types';

/**
 * Default KPI config sesuai PRD Section 9.2 dan 9.8.
 * Bobot 35/25/15/25 (sum = 1.0) — di-approve CEO sebagai major change framework.
 */
export const kpiConfigMock: KpiPeriodConfig = {
  effectiveFrom: '2026-01-01',
  weights: {
    taskCompletion: 0.35,
    timeliness: 0.25,
    updateCompliance: 0.15,
    outputQuality: 0.25
  },
  onTimeToleranceDays: 2,
  updateGapTargetDays: 3,
  qualityRatingScale: 5,
  period: 'monthly',
  approvedBy: { id: 'ceo@erp.local', name: 'CEO User', role: 'CEO' },
  approvedAt: '2025-12-15T10:00:00.000Z'
};
