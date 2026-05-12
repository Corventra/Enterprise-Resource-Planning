import type { Role } from '../../../app/permissions';
import {
  approvalEngagementLetterDetailsMock,
  engagementLetterApprovalsMock,
  handoverApprovalsMock
} from '../mocks/approval.mock';
import { approvalProposalsService } from './approval-proposals-service';
import type { ApprovalItem } from '../types/approval.types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const engagementLettersStore: ApprovalItem[] = clone(engagementLetterApprovalsMock);
const handoverStore: ApprovalItem[] = clone(handoverApprovalsMock);

export const approvalService = {
  async getAll(): Promise<ApprovalItem[]> {
    const proposalResult = await approvalProposalsService.listPending().catch(() => ({
      items: [] as ApprovalItem[],
      proposalsById: {},
      companyNamesById: {}
    }));

    return [...clone(handoverStore), ...proposalResult.items, ...clone(engagementLettersStore)];
  },

  getEngagementLetters(approvalId: string) {
    return approvalEngagementLetterDetailsMock[approvalId] ?? [];
  },

  async approve(item: ApprovalItem, actor: { name: string; role: Role }, note?: string): Promise<void> {
    void actor;
    void note;
    if (item.kind === 'Proposal') {
      await approvalProposalsService.approve(item.id);
      return;
    }
    const store = item.kind === 'EngagementLetter' ? engagementLettersStore : handoverStore;
    const idx = store.findIndex((entry) => entry.id === item.id);
    if (idx >= 0) store.splice(idx, 1);
  },

  async requestRevision(item: ApprovalItem, actor: { name: string; role: Role }, note?: string): Promise<void> {
    void actor;
    if (item.kind === 'Proposal') {
      if (!note?.trim()) {
        throw new Error('Revision note wajib diisi.');
      }
      await approvalProposalsService.reject(item.id, note.trim());
      return;
    }
    const store = item.kind === 'EngagementLetter' ? engagementLettersStore : handoverStore;
    const idx = store.findIndex((entry) => entry.id === item.id);
    if (idx >= 0) store.splice(idx, 1);
  }
};
