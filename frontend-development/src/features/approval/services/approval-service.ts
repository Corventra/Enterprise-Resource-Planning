import type { Role } from '../../../app/permissions';
import { handoverService } from '../../handover/services/handover-service';
import { engagementLetterApprovalsMock, proposalApprovalsMock } from '../mocks/approval.mock';
import type { ApprovalItem } from '../types/approval.types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const proposalsStore: ApprovalItem[] = clone(proposalApprovalsMock);
const engagementLettersStore: ApprovalItem[] = clone(engagementLetterApprovalsMock);

const buildHandoverApproval = (
  source: { id: string; docCode: string; client: string; project: string; serviceLine: string }
): ApprovalItem => ({
  id: `apv-ho-${source.id}`,
  kind: 'HandoverMemo',
  sourceId: source.id,
  docCode: source.docCode,
  client: source.client,
  title: source.project,
  serviceLine: source.serviceLine,
  submittedBy: 'BD Team',
  submittedAt: '2026-04-25T08:00:00.000Z',
  summary: `Handover memo for ${source.serviceLine} engagement, awaiting CEO sign-off.`,
  detailRoute: `/handover/${source.id}`
});

export const approvalService = {
  async getAll(): Promise<ApprovalItem[]> {
    const handovers = await handoverService.getAll();
    const handoverApprovals = handovers
      .filter((h) => h.status === 'Waiting CEO Approval')
      .map(buildHandoverApproval);

    return [
      ...handoverApprovals,
      ...clone(proposalsStore),
      ...clone(engagementLettersStore)
    ];
  },

  async approve(item: ApprovalItem, actor: { name: string; role: Role }, note?: string): Promise<void> {
    if (item.kind === 'HandoverMemo') {
      await handoverService.approve(item.sourceId, actor, note);
      return;
    }
    const store = item.kind === 'Proposal' ? proposalsStore : engagementLettersStore;
    const idx = store.findIndex((entry) => entry.id === item.id);
    if (idx >= 0) store.splice(idx, 1);
  },

  async requestRevision(item: ApprovalItem, actor: { name: string; role: Role }, note?: string): Promise<void> {
    if (item.kind === 'HandoverMemo') {
      await handoverService.requestRevision(item.sourceId, actor, note);
      return;
    }
    const store = item.kind === 'Proposal' ? proposalsStore : engagementLettersStore;
    const idx = store.findIndex((entry) => entry.id === item.id);
    if (idx >= 0) store.splice(idx, 1);
  }
};
