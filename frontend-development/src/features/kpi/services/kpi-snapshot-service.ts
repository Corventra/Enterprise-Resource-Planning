import type { Role } from '../../../app/permissions';
import { kpiSnapshotsMock } from '../mocks/kpi-snapshots.mock';
import type { KpiSnapshot } from '../types/kpi.types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const STORAGE_KEY = 'erp_kpi_snapshots';

const loadFromStorage = (): KpiSnapshot[] => {
  try {
    if (typeof window === 'undefined') return clone(kpiSnapshotsMock);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(kpiSnapshotsMock);
    const parsed = JSON.parse(raw) as KpiSnapshot[];
    if (!Array.isArray(parsed)) return clone(kpiSnapshotsMock);
    return parsed;
  } catch {
    return clone(kpiSnapshotsMock);
  }
};

const persist = (data: KpiSnapshot[]) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    /* ignore quota / unavailable */
  }
};

const snapshotStore: KpiSnapshot[] = loadFromStorage();

const keyOf = (consultantId: string, period: string) => `${consultantId}::${period}`;

export const kpiSnapshotService = {
  async getAll(): Promise<KpiSnapshot[]> {
    return clone(snapshotStore);
  },
  async getByConsultant(consultantId: string): Promise<KpiSnapshot[]> {
    return clone(
      snapshotStore
        .filter((s) => s.consultantId === consultantId)
        .sort((a, b) => a.period.localeCompare(b.period))
    );
  },
  async getByConsultantAndPeriod(consultantId: string, period: string): Promise<KpiSnapshot | undefined> {
    const found = snapshotStore.find(
      (s) => s.consultantId === consultantId && s.period === period
    );
    return found ? clone(found) : undefined;
  },
  /**
   * Upsert snapshot (preliminary or final). Replaces existing entry with same
   * (consultantId, period) key. Tidak akan overwrite snapshot yang sudah
   * `finalizedAt` — kecuali via `recompute()` dengan audit log.
   */
  async save(snapshot: KpiSnapshot): Promise<KpiSnapshot> {
    const idx = snapshotStore.findIndex(
      (s) => keyOf(s.consultantId, s.period) === keyOf(snapshot.consultantId, snapshot.period)
    );
    if (idx >= 0) {
      if (snapshotStore[idx].finalizedAt) {
        throw new Error(
          `Snapshot ${snapshot.consultantId} ${snapshot.period} sudah finalized. Pakai overwriteFinalized() (HRD/COO).`
        );
      }
      snapshotStore[idx] = clone(snapshot);
    } else {
      snapshotStore.push(clone(snapshot));
    }
    persist(snapshotStore);
    return clone(snapshot);
  },
  /**
   * HRD/CEO action: lock snapshot — set `finalizedAt` & `finalizedBy`. Snapshot
   * jadi immutable via `save()` setelah ini.
   */
  async finalize(
    consultantId: string,
    period: string,
    actor: { id: string; name: string; role: Role }
  ): Promise<KpiSnapshot | undefined> {
    const idx = snapshotStore.findIndex(
      (s) => s.consultantId === consultantId && s.period === period
    );
    if (idx < 0) return undefined;
    snapshotStore[idx] = {
      ...snapshotStore[idx],
      finalizedAt: new Date().toISOString(),
      finalizedBy: { id: actor.id, name: actor.name, role: actor.role }
    };
    persist(snapshotStore);
    return clone(snapshotStore[idx]);
  },
  /**
   * HRD/COO action: recompute even if finalized — for data correction. Bypasses
   * the finalized lock. Caller is responsible for audit logging at the wrapper.
   */
  async overwriteFinalized(snapshot: KpiSnapshot): Promise<KpiSnapshot> {
    const idx = snapshotStore.findIndex(
      (s) => keyOf(s.consultantId, s.period) === keyOf(snapshot.consultantId, snapshot.period)
    );
    if (idx >= 0) {
      snapshotStore[idx] = clone(snapshot);
    } else {
      snapshotStore.push(clone(snapshot));
    }
    persist(snapshotStore);
    return clone(snapshot);
  },
  /**
   * Reset to initial mock — for demo / testing. Clears localStorage.
   */
  async resetToMock(): Promise<void> {
    snapshotStore.splice(0, snapshotStore.length, ...clone(kpiSnapshotsMock));
    persist(snapshotStore);
  }
};
