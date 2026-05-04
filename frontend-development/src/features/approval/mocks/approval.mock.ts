import type { ApprovalItem } from '../types/approval.types';

export const proposalApprovalsMock: ApprovalItem[] = [
  {
    id: 'apv-prop-001',
    kind: 'Proposal',
    sourceId: 'lead-002',
    docCode: 'BD-PROP-PRT-2026-002',
    client: 'CV Prima Tekno',
    title: 'Transfer Pricing Documentation Engagement',
    serviceLine: 'Transfer Pricing',
    submittedBy: 'Laras Wijaya',
    submittedAt: '2026-04-22T10:30:00.000Z',
    summary: 'Phased rollout, two-week validation gates, total fee covers FY 2024–2025.',
    detailRoute: '/lead-workspace/lead-002/proposal'
  },
  {
    id: 'apv-prop-002',
    kind: 'Proposal',
    sourceId: 'lead-005',
    docCode: 'BD-PROP-SRI-2026-005',
    client: 'PT Solusi Retail Indonesia',
    title: 'Annual Tax Compliance & Advisory Retainer',
    serviceLine: 'Tax',
    submittedBy: 'Andi Setiawan',
    submittedAt: '2026-04-23T09:15:00.000Z',
    summary: 'Monthly retainer model, includes ad-hoc advisory hours and year-end CIT.',
    detailRoute: '/lead-workspace/lead-005/proposal'
  }
];

export const engagementLetterApprovalsMock: ApprovalItem[] = [
  {
    id: 'apv-el-001',
    kind: 'EngagementLetter',
    sourceId: 'lead-003',
    docCode: 'BD-EL-GSI-2026-003',
    client: 'PT Garuda Sistem Integrasi',
    title: 'Engagement Letter — Transfer Pricing Advisory',
    serviceLine: 'Transfer Pricing',
    submittedBy: 'Raka Pratama',
    submittedAt: '2026-04-21T14:00:00.000Z',
    summary: 'Client requested clause adjustment on confidentiality and IP ownership.',
    detailRoute: '/lead-workspace/lead-003/engagement-letter'
  }
];
