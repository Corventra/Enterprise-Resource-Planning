import type { Role } from '../../../app/permissions';
import { kpiConfigMock } from '../mocks/kpi-config.mock';
import { KPI_DIMENSION_KEYS, type KpiPeriodConfig } from '../types/kpi.types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const STORAGE_KEY_CONFIG = 'erp_kpi_config';
const STORAGE_KEY_PENDING = 'erp_kpi_config_pending';

export interface PendingMajorChange {
  proposed: KpiPeriodConfig;
  proposedBy: { id: string; name: string; role: Role };
  proposedAt: string;
}

const loadCurrent = (): KpiPeriodConfig => {
  try {
    if (typeof window === 'undefined') return clone(kpiConfigMock);
    const raw = window.localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return clone(kpiConfigMock);
    return JSON.parse(raw) as KpiPeriodConfig;
  } catch {
    return clone(kpiConfigMock);
  }
};

const loadPending = (): PendingMajorChange | null => {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY_PENDING);
    if (!raw) return null;
    return JSON.parse(raw) as PendingMajorChange;
  } catch {
    return null;
  }
};

const persistCurrent = (config: KpiPeriodConfig) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    }
  } catch {
    /* ignore */
  }
};

const persistPending = (pending: PendingMajorChange | null) => {
  try {
    if (typeof window === 'undefined') return;
    if (pending) {
      window.localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(pending));
    } else {
      window.localStorage.removeItem(STORAGE_KEY_PENDING);
    }
  } catch {
    /* ignore */
  }
};

let currentConfig: KpiPeriodConfig = loadCurrent();
let pendingMajorChange: PendingMajorChange | null = loadPending();

const haveDifferentWeights = (a: KpiPeriodConfig, b: KpiPeriodConfig): boolean => {
  return KPI_DIMENSION_KEYS.some((key) => Math.abs(a.weights[key] - b.weights[key]) > 1e-6);
};

export const kpiConfigService = {
  async getCurrent(): Promise<KpiPeriodConfig> {
    return clone(currentConfig);
  },
  async getPending(): Promise<PendingMajorChange | null> {
    return pendingMajorChange ? clone(pendingMajorChange) : null;
  },
  /**
   * Update config. Perubahan weights (major change) masuk pending state, wajib
   * di-approve CEO. Threshold/period applied immediately tanpa approval.
   * Returns both: current effective config + pending (kalau ada).
   */
  async update(
    next: KpiPeriodConfig,
    actor: { id: string; name: string; role: Role }
  ): Promise<{ current: KpiPeriodConfig; pending: PendingMajorChange | null }> {
    const isMajor = haveDifferentWeights(currentConfig, next);
    if (isMajor) {
      pendingMajorChange = {
        proposed: clone(next),
        proposedBy: { id: actor.id, name: actor.name, role: actor.role },
        proposedAt: new Date().toISOString()
      };
      currentConfig = {
        ...currentConfig,
        onTimeToleranceDays: next.onTimeToleranceDays,
        updateGapTargetDays: next.updateGapTargetDays,
        period: next.period
      };
    } else {
      currentConfig = clone(next);
    }
    persistCurrent(currentConfig);
    persistPending(pendingMajorChange);
    return {
      current: clone(currentConfig),
      pending: pendingMajorChange ? clone(pendingMajorChange) : null
    };
  },
  /**
   * CEO action: approve pending major change → effective.
   */
  async approveMajorChange(
    actor: { id: string; name: string; role: Role }
  ): Promise<KpiPeriodConfig> {
    if (!pendingMajorChange) throw new Error('Tidak ada pending major change.');
    currentConfig = {
      ...pendingMajorChange.proposed,
      approvedBy: { id: actor.id, name: actor.name, role: actor.role },
      approvedAt: new Date().toISOString(),
      effectiveFrom: new Date().toISOString().slice(0, 10)
    };
    pendingMajorChange = null;
    persistCurrent(currentConfig);
    persistPending(null);
    return clone(currentConfig);
  },
  /**
   * CEO action: reject pending — discarded, current stays.
   */
  async rejectMajorChange(_actor: { id: string; name: string; role: Role }): Promise<void> {
    pendingMajorChange = null;
    persistPending(null);
  },
  async resetToMock(): Promise<void> {
    currentConfig = clone(kpiConfigMock);
    pendingMajorChange = null;
    persistCurrent(currentConfig);
    persistPending(null);
  }
};
