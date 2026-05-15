import type { Role } from '../../../app/permissions';
import { approvalEngagementsService } from './approval-engagements-service';
import { approvalHandoversService } from './approval-handovers-service';
import { approvalProposalsService } from './approval-proposals-service';
import type { ApprovalItem } from '../types/approval.types';

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

    let handoverItems: ApprovalItem[] = [];
    try {
      handoverItems = await approvalHandoversService.listPendingApprovals();
    } catch {
      handoverItems = [];
    }

    return [...handoverItems, ...proposalResult.items, ...engagementLetterItems];
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
    if (item.kind === 'HandoverMemo') {
      await approvalHandoversService.approveHandover(item.id);
      return;
    }
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
    if (item.kind === 'HandoverMemo') {
      if (!note?.trim()) {
        throw new Error('Revision note wajib diisi.');
      }
      await approvalHandoversService.rejectHandover(item.id, note.trim());
    }
  }
};
