import type { Role } from '../../../app/permissions';
import { apiGet, apiPut } from '../../../services/api-client';
import type { KpiPeriodConfig } from '../types/kpi.types';

/**
 * KPI Config service — backend-backed (Phase 6a).
 *
 * Backend simplifikasi: tidak ada "pending major change" state — CEO update
 * langsung apply (insert row baru ke kpi_period_config, latest = active).
 * Method `getPending` / `approveMajorChange` / `rejectMajorChange` dipertahankan
 * sebagai no-op shim supaya UI lama (kpi-config-page) tidak break.
 */

export interface PendingMajorChange {
  proposed: KpiPeriodConfig;
  proposedBy: { id: string; name: string; role: Role };
  proposedAt: string;
}

interface ApiKpiConfigPayload {
  configId: number;
  effectiveFrom: string;
  weights: {
    taskCompletion: number;
    timeliness: number;
    updateCompliance: number;
    outputQuality: number;
  };
  onTimeToleranceDays: number;
  updateGapTargetDays: number;
  qualityRatingScale: 5;
  period: 'monthly' | 'quarterly';
  approvedBy?: { id: string; name: string; role: Role };
  approvedAt?: string;
}

interface ConfigResponse {
  success: boolean;
  data: { config: ApiKpiConfigPayload };
}

const mapApiToConfig = (payload: ApiKpiConfigPayload): KpiPeriodConfig => ({
  effectiveFrom: payload.effectiveFrom,
  weights: payload.weights,
  onTimeToleranceDays: payload.onTimeToleranceDays,
  updateGapTargetDays: payload.updateGapTargetDays,
  qualityRatingScale: payload.qualityRatingScale,
  period: payload.period,
  approvedBy: payload.approvedBy,
  approvedAt: payload.approvedAt
});

export const kpiConfigService = {
  async getCurrent(): Promise<KpiPeriodConfig> {
    const res = await apiGet<ConfigResponse>('/kpi/config');
    return mapApiToConfig(res.data.config);
  },

  /** Backend tidak punya pending state — selalu null. */
  async getPending(): Promise<PendingMajorChange | null> {
    return null;
  },

  /**
   * CEO update config. Apply langsung (tidak ada review pending state).
   * Return current = config terbaru, pending = null.
   */
  async update(
    next: KpiPeriodConfig,
    _actor: { id: string; name: string; role: Role }
  ): Promise<{ current: KpiPeriodConfig; pending: PendingMajorChange | null }> {
    const res = await apiPut<ConfigResponse>('/kpi/config', {
      effectiveFrom: next.effectiveFrom,
      weights: next.weights,
      onTimeToleranceDays: next.onTimeToleranceDays,
      updateGapTargetDays: next.updateGapTargetDays,
      qualityRatingScale: next.qualityRatingScale,
      period: next.period
    });
    return { current: mapApiToConfig(res.data.config), pending: null };
  },

  /** No-op (no pending state in backend). Return current config. */
  async approveMajorChange(
    _actor: { id: string; name: string; role: Role }
  ): Promise<KpiPeriodConfig> {
    return this.getCurrent();
  },

  /** No-op. */
  async rejectMajorChange(_actor: { id: string; name: string; role: Role }): Promise<void> {
    return;
  }
};
