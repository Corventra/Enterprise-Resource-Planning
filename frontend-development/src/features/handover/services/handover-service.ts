import {
  getHandoverById,
  getHandoverList,
  patchHandoverDraft,
  submitHandover as submitHandoverApi,
  type ApiHandoverDetailPayload
} from './handover-api';
import { apiGet } from '../../../services/api-client';
import { mapApiHandoverDetailToDetail, mapApiHandoverListRowToItem } from '../utils/map-api-handover';
import type { HandoverPatchExtras } from '../utils/build-handover-patch-payload';
import { buildHandoverPatchFormData } from '../utils/build-handover-patch-payload';
import type {
  HandoverDetail,
  HandoverItem,
  HandoverListMeta,
  HandoverSnapshotCount,
  HandoverSummary,
  HandoverSummaryCreatedByTarget
} from '../types/handover.types';

const mapSnapshot = (row: { value: number }): HandoverSnapshotCount => ({ value: row.value });

export const handoverService = {
  async getList(
    summaryCreatedByTarget: HandoverSummaryCreatedByTarget = null
  ): Promise<{ items: HandoverItem[]; summary: HandoverSummary; meta: HandoverListMeta }> {
    const data = await getHandoverList(summaryCreatedByTarget);
    return {
      items: data.items.map(mapApiHandoverListRowToItem),
      summary: {
        totalHandover: mapSnapshot(data.summary.total_handover),
        totalDraft: mapSnapshot(data.summary.total_draft),
        totalAwaitingApproval: mapSnapshot(data.summary.total_awaiting_approval),
        totalActive: mapSnapshot(data.summary.total_active)
      },
      meta: {
        scope: data.meta.scope,
        summaryCreatedByUserId: data.meta.summary_created_by
      }
    };
  },

  async getById(id: string): Promise<HandoverDetail | undefined> {
    try {
      const data = await getHandoverById(id);
      return mapApiHandoverDetailToDetail(data);
    } catch {
      return undefined;
    }
  },

  /**
   * Ambil handover detail via project context (PROJECT_VIEW permission).
   * Cocok untuk PM/Consultant yang tidak punya HANDOVER_MANAGE/APPROVE tapi
   * boleh lihat handover karena ter-assign ke project-nya.
   */
  async getByProjectId(projectId: string): Promise<HandoverDetail | undefined> {
    try {
      const res = await apiGet<{ success: boolean; data: ApiHandoverDetailPayload }>(
        `/projects/${projectId}/handover`
      );
      return mapApiHandoverDetailToDetail(res.data);
    } catch {
      return undefined;
    }
  },

  async getItemById(id: string): Promise<HandoverItem | undefined> {
    const { items } = await this.getList();
    return items.find((entry) => entry.id === id);
  },

  async updateDraft(id: string, form: HandoverDetail, extras: HandoverPatchExtras): Promise<HandoverDetail> {
    const formData = buildHandoverPatchFormData(form, extras);
    const data = await patchHandoverDraft(id, formData);
    return mapApiHandoverDetailToDetail(data);
  },

  async submit(id: string): Promise<HandoverDetail> {
    const data = await submitHandoverApi(id);
    return mapApiHandoverDetailToDetail(data);
  },

  /** Mutasi approval/assign — belum diimplementasi (batch berikutnya). */
  async approve(_id: string, _actor: { name: string; role: import('../../../app/permissions').Role }, _note?: string): Promise<void> {
    throw new Error('Approval handover belum tersedia.');
  },
  async requestRevision(_id: string, _actor: { name: string; role: import('../../../app/permissions').Role }, _note?: string): Promise<void> {
    throw new Error('Revision handover belum tersedia.');
  },
  async assignPM(_id: string, _actor: { name: string; role: import('../../../app/permissions').Role }, _note?: string): Promise<void> {
    throw new Error('Assign PM belum tersedia.');
  },
  async getTrail(_id: string): Promise<never[]> {
    return [];
  },
  async appendTrailEntry(
    _id: string,
    _action: import('../types/handover.types').HandoverApprovalAction,
    _actor: { name: string; role: import('../../../app/permissions').Role },
    _note?: string
  ): Promise<void> {
    throw new Error('Activity trail handover belum tersedia.');
  }
};
