import type { Role } from '../../../app/permissions';
import { apiGet, apiPost } from '../../../services/api-client';
import type { KpiSnapshot } from '../types/kpi.types';

/**
 * KPI Snapshot service — backend-backed (Phase 6b).
 *
 * Snapshot di backend HANYA store yang sudah finalized (via Finalize button).
 * Preliminary snapshot stays in-memory di frontend (computed live via kpi-engine).
 *
 * Untuk kompatibilitas dengan UI lama (kpi-consultant-page calls save() +
 * finalize() berurutan), `save()` di-keep sebagai no-op — return input
 * unchanged. Hanya `finalize()` dan `overwriteFinalized()` yang benar-benar
 * persist ke DB.
 */

interface ApiKpiSnapshotDimension {
  weight: number;
  capaian: number;
  rawValue: number;
  contributingTaskIds: string[];
}

interface ApiKpiSnapshotPayload {
  consultantId: string;
  consultantName: string;
  period: string;
  computedAt: string;
  finalizedAt?: string;
  finalizedBy?: { id: string; name: string; role: string };
  dimensions: {
    taskCompletion: ApiKpiSnapshotDimension;
    timeliness: ApiKpiSnapshotDimension;
    updateCompliance: ApiKpiSnapshotDimension;
    outputQuality: ApiKpiSnapshotDimension;
  };
  total: number;
  contributingProjectIds: string[];
}

const mapApiToSnapshot = (p: ApiKpiSnapshotPayload): KpiSnapshot => ({
  consultantId: p.consultantId,
  consultantName: p.consultantName,
  period: p.period,
  computedAt: p.computedAt,
  finalizedAt: p.finalizedAt,
  finalizedBy: p.finalizedBy
    ? { id: p.finalizedBy.id, name: p.finalizedBy.name, role: p.finalizedBy.role as Role }
    : undefined,
  dimensions: p.dimensions,
  total: p.total,
  contributingProjectIds: p.contributingProjectIds ?? []
});

interface ListResponse {
  success: boolean;
  data: { items: ApiKpiSnapshotPayload[] };
}

interface SingleResponse {
  success: boolean;
  data: { snapshot: ApiKpiSnapshotPayload };
}

/**
 * Build payload untuk POST /api/kpi/snapshots. Backend hanya butuh capaian
 * per dimension + total. Frontend kirim full snapshot, backend pick yang perlu.
 */
const toUpsertPayload = (snapshot: KpiSnapshot) => ({
  consultantId: Number(snapshot.consultantId),
  consultantName: snapshot.consultantName,
  period: snapshot.period,
  dimensions: {
    taskCompletion: snapshot.dimensions.taskCompletion.capaian,
    timeliness: snapshot.dimensions.timeliness.capaian,
    updateCompliance: snapshot.dimensions.updateCompliance.capaian,
    outputQuality: snapshot.dimensions.outputQuality.capaian
  },
  total: snapshot.total
});

export const kpiSnapshotService = {
  async getAll(): Promise<KpiSnapshot[]> {
    const res = await apiGet<ListResponse>('/kpi/snapshots');
    return res.data.items.map(mapApiToSnapshot);
  },

  async getByConsultant(consultantId: string): Promise<KpiSnapshot[]> {
    const cid = Number(consultantId);
    if (!Number.isInteger(cid) || cid <= 0) return [];
    try {
      const res = await apiGet<ListResponse>(`/kpi/snapshots/consultant/${cid}`);
      return res.data.items.map(mapApiToSnapshot);
    } catch {
      return [];
    }
  },

  async getByConsultantAndPeriod(consultantId: string, period: string): Promise<KpiSnapshot | undefined> {
    const cid = Number(consultantId);
    if (!Number.isInteger(cid) || cid <= 0) return undefined;
    try {
      const res = await apiGet<SingleResponse>(
        `/kpi/snapshots/consultant/${cid}/${encodeURIComponent(period)}`
      );
      return mapApiToSnapshot(res.data.snapshot);
    } catch {
      return undefined;
    }
  },

  /**
   * NO-OP — backend tidak store preliminary snapshot. Return input unchanged
   * supaya caller code lama yang `await save(snapshot)` tetap jalan.
   */
  async save(snapshot: KpiSnapshot): Promise<KpiSnapshot> {
    return snapshot;
  },

  /**
   * CEO action: lock snapshot. Backend upsert row dengan finalized_at = NOW(),
   * finalized_by = req.user. Signature berubah dari versi mock: sekarang terima
   * full snapshot, bukan (consultantId, period, actor).
   */
  async finalize(snapshot: KpiSnapshot, _actor: { id: string; name: string; role: Role }): Promise<KpiSnapshot> {
    const res = await apiPost<SingleResponse>('/kpi/snapshots', toUpsertPayload(snapshot));
    return mapApiToSnapshot(res.data.snapshot);
  },

  /**
   * CEO/COO recompute even on finalized — backend upsert pattern handle
   * overwrite via ON DUPLICATE KEY UPDATE.
   */
  async overwriteFinalized(snapshot: KpiSnapshot): Promise<KpiSnapshot> {
    const res = await apiPost<SingleResponse>('/kpi/snapshots', toUpsertPayload(snapshot));
    return mapApiToSnapshot(res.data.snapshot);
  }
};
