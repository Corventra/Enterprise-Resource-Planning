import type { Campaign } from '../types/campaign.types';

export const campaignsMock: Campaign[] = [
  {
    id: 'cmp-001',
    name: 'Q2 SME Acquisition Drive',
    createdBy: 'MEO User',
    type: 'Acquisition',
    status: 'Active',
    channel: 'LinkedIn',
    topic: 'SME Financing',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    notes: 'Focus on SME owners in Jabodetabek area.',
    totalSubmissions: 126,
    createdAt: '2026-03-28T09:00:00.000Z',
    updatedAt: '2026-04-14T10:10:00.000Z'
  },
  {
    id: 'cmp-002',
    name: 'Payroll Service Reactivation',
    createdBy: 'BD User',
    type: 'Retention',
    status: 'Active',
    channel: 'Email',
    topic: 'Payroll Bundling',
    startDate: '2026-03-15',
    endDate: '2026-05-15',
    notes: 'Re-activate dormant payroll clients.',
    totalSubmissions: 78,
    createdAt: '2026-03-10T08:00:00.000Z',
    updatedAt: '2026-04-12T13:20:00.000Z'
  },
  {
    id: 'cmp-003',
    name: 'Brand Awareness Ramadan',
    createdBy: 'Marketing Admin',
    type: 'Awareness',
    status: 'Completed',
    channel: 'Instagram',
    topic: 'Campaign Branding',
    startDate: '2026-02-15',
    endDate: '2026-03-31',
    notes: 'Seasonal awareness push.',
    totalSubmissions: 54,
    createdAt: '2026-02-01T09:30:00.000Z',
    updatedAt: '2026-03-31T17:00:00.000Z'
  },
  {
    id: 'cmp-004',
    name: 'Enterprise Outbound Pilot',
    createdBy: 'Business Ops',
    type: 'Acquisition',
    status: 'Draft',
    channel: 'WhatsApp',
    topic: 'Enterprise Outreach',
    startDate: '2026-05-01',
    endDate: '2026-07-31',
    notes: 'Pilot for enterprise pipeline.',
    totalSubmissions: 0,
    createdAt: '2026-04-10T11:45:00.000Z',
    updatedAt: '2026-04-14T16:00:00.000Z'
  },
  {
    id: 'cmp-005',
    name: 'Landing Page Optimization',
    createdBy: 'Digital Team',
    type: 'Retention',
    status: 'Paused',
    channel: 'Website',
    topic: 'Website Conversion',
    startDate: '2026-03-20',
    endDate: '2026-06-20',
    notes: 'Paused pending content approval.',
    totalSubmissions: 31,
    createdAt: '2026-03-18T14:10:00.000Z',
    updatedAt: '2026-04-11T09:00:00.000Z'
  }
];
