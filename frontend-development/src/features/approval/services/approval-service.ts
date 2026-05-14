import type { Role } from '../../../app/permissions';
import { handoverApprovalsMock } from '../mocks/approval.mock';
import { approvalEngagementsService } from './approval-engagements-service';
import { approvalProposalsService } from './approval-proposals-service';
import type { ApprovalItem } from '../types/approval.types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const handoverStore: ApprovalItem[] = clone(handoverApprovalsMock);

export const approvalService = {
  async getAll(): Promise<ApprovalItem[]> {
    const proposalResult = await approvalProposalsService.listPending().catch(() => ({
      items: [] as ApprovalItem[],
      proposalsById: {},
      companyNamesById: {}
    }));

    let engagementLetterItems: ApprovalItem[] = [];
    try {
      engagementLetterItems = await approvalEngagementsService.listPendingApprovals();
    } catch {
      engagementLetterItems = [];
    }

    return [...clone(handoverStore), ...proposalResult.items, ...engagementLetterItems];
  },

  async approve(item: ApprovalItem, actor: { name: string; role: Role }, note?: string): Promise<void> {
    void actor;
    void note;
    if (item.kind === 'Proposal') {
      await approvalProposalsService.approve(item.id);
      return;
    }
    if (item.kind === 'EngagementLetter') {
      await approvalEngagementsService.approveEngagement(item.id);
      return;
    }
    const idx = handoverStore.findIndex((entry) => entry.id === item.id);
    if (idx >= 0) handoverStore.splice(idx, 1);
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
    if (item.kind === 'EngagementLetter') {
      if (!note?.trim()) {
        throw new Error('Revision note wajib diisi.');
      }
      await approvalEngagementsService.rejectEngagement(item.id, note.trim());
      return;
    }
    const idx = handoverStore.findIndex((entry) => entry.id === item.id);
    if (idx >= 0) handoverStore.splice(idx, 1);
  }
};
