import type { ApprovalItem } from '../types/approval.types';

export const handoverApprovalsMock: ApprovalItem[] = [
  {
    id: 'apv-ho-001',
    kind: 'HandoverMemo',
    sourceId: 'ho-001',
    docCode: 'BD-HO-PT-MSM-2025-003',
    client: 'PT Maju Sejahtera Manufacturing (PT MSM)',
    title: 'Transfer Pricing Documentation (Master File & Local File) - FY 2024',
    serviceLine: 'Transfer Pricing',
    submittedBy: 'BD Team',
    submittedAt: '2026-04-25T08:00:00.000Z',
    summary: 'Handover memo for Transfer Pricing engagement, awaiting CEO sign-off.',
    detailRoute: '/handover/ho-001'
  }
];
