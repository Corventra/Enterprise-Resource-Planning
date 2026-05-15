import {
  getHandoverById,
  getHandovers,
  patchHandoverDraft,
  submitHandover as submitHandoverApi
} from './handover-api';
import { mapApiHandoverDetailToDetail, mapApiHandoverListRowToItem } from '../utils/map-api-handover';
import type { HandoverPatchExtras } from '../utils/build-handover-patch-payload';
import { buildHandoverPatchFormData } from '../utils/build-handover-patch-payload';
import type { HandoverDetail, HandoverItem } from '../types/handover.types';

export const handoverService = {
  async getAll(): Promise<HandoverItem[]> {
    const rows = await getHandovers();
    return rows.map(mapApiHandoverListRowToItem);
  },

  async getById(id: string): Promise<HandoverDetail | undefined> {
    try {
      const data = await getHandoverById(id);
      return mapApiHandoverDetailToDetail(data);
    } catch {
      return undefined;
    }
  },

  async getItemById(id: string): Promise<HandoverItem | undefined> {
    const items = await this.getAll();
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
