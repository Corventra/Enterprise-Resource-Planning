import type { Form } from '../types/campaign.types';

export const formsMock: Form[] = [
  {
    id: 'frm-001',
    campaignId: 'cmp-001',
    name: 'SME Lead Qualification Form',
    status: 'Active',
    publishedAt: '2026-04-01',
    submissionCount: 72
  },
  {
    id: 'frm-002',
    campaignId: 'cmp-001',
    name: 'Consultation Booking Form',
    status: 'Active',
    publishedAt: '2026-04-05',
    submissionCount: 54
  },
  {
    id: 'frm-003',
    campaignId: 'cmp-002',
    name: 'Payroll Upgrade Form',
    status: 'Active',
    publishedAt: '2026-03-16',
    submissionCount: 78
  },
  {
    id: 'frm-004',
    campaignId: 'cmp-003',
    name: 'Awareness Feedback Form',
    status: 'Archived',
    publishedAt: '2026-02-18',
    submissionCount: 54
  },
  {
    id: 'frm-005',
    campaignId: 'cmp-005',
    name: 'Landing Page Interest Form',
    status: 'Active',
    publishedAt: '2026-03-22',
    submissionCount: 31
  }
];
