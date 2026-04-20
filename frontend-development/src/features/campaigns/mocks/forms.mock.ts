import type { Form } from '../types/campaign.types';

const origin = 'http://localhost:5173';

export const formsMock: Form[] = [
  {
    id: 'frm-001',
    campaignId: 'cmp-001',
    name: 'SME Lead Qualification Form',
    status: 'Active',
    publishedAt: '2026-04-08T15:07:00.000Z',
    submissionCount: 72,
    fieldCount: 4,
    createdAt: '2026-04-01T09:00:00.000Z',
    updatedAt: '2026-04-08T14:00:00.000Z',
    createdBy: 'MEO User',
    shortLinks: [
      { label: 'Instagram', url: `${origin}/form-sme-lead-instagram` },
      { label: 'LinkedIn', url: `${origin}/form-sme-lead-linkedin` }
    ]
  },
  {
    id: 'frm-002',
    campaignId: 'cmp-001',
    name: 'Consultation Booking Form',
    status: 'Active',
    publishedAt: '2026-04-05T11:30:00.000Z',
    submissionCount: 54,
    fieldCount: 6,
    createdAt: '2026-03-28T08:15:00.000Z',
    updatedAt: '2026-04-05T10:00:00.000Z',
    createdBy: 'BD User',
    shortLinks: [
      { label: 'Website', url: `${origin}/form-consultation-web` },
      { label: 'WhatsApp', url: `${origin}/form-consultation-wa` }
    ]
  },
  {
    id: 'frm-003',
    campaignId: 'cmp-002',
    name: 'Payroll Upgrade Form',
    status: 'Active',
    publishedAt: '2026-03-16T12:00:00.000Z',
    submissionCount: 78,
    fieldCount: 5,
    createdAt: '2026-03-10T07:00:00.000Z',
    updatedAt: '2026-03-16T11:00:00.000Z',
    createdBy: 'BD User',
    shortLinks: [{ label: 'Email', url: `${origin}/form-payroll-upgrade` }]
  },
  {
    id: 'frm-004',
    campaignId: 'cmp-003',
    name: 'Awareness Feedback Form',
    status: 'Archived',
    publishedAt: '2026-02-18T16:45:00.000Z',
    submissionCount: 54,
    fieldCount: 3,
    createdAt: '2026-02-01T09:30:00.000Z',
    updatedAt: '2026-03-01T17:00:00.000Z',
    createdBy: 'Marketing Admin',
    shortLinks: [{ label: 'Instagram', url: `${origin}/form-awareness-feedback` }]
  },
  {
    id: 'frm-005',
    campaignId: 'cmp-005',
    name: 'Landing Page Interest Form',
    status: 'Active',
    publishedAt: '2026-03-22T09:20:00.000Z',
    submissionCount: 31,
    fieldCount: 4,
    createdAt: '2026-03-18T14:10:00.000Z',
    updatedAt: '2026-03-22T08:00:00.000Z',
    createdBy: 'Digital Team',
    shortLinks: [
      { label: 'Website', url: `${origin}/form-landing-interest` },
      { label: 'LinkedIn', url: `${origin}/form-landing-linkedin` }
    ]
  }
];
