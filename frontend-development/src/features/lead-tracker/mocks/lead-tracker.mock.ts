import type { LeadTrackerItem } from '../types/lead-tracker.types';

export const leadTrackerMock: LeadTrackerItem[] = [
  {
    id: 'lead-001',
    company: 'PT Sinar Logistik Nusantara',
    currentStage: 'MEETING',
    stageProgress: 'Scheduled',
    processedBy: 'Andi Setiawan',
    processedAt: '2026-04-20T09:15:00.000Z',
    nextAction: 'Conduct meeting',
    dueDate: '2026-04-23',
    status: 'Need Follow Up'
  },
  {
    id: 'lead-002',
    company: 'CV Prima Tekno',
    currentStage: 'PROPOSAL',
    stageProgress: 'Revision Needed',
    processedBy: 'Laras Wijaya',
    processedAt: '2026-04-19T13:20:00.000Z',
    nextAction: 'Revise proposal',
    dueDate: '2026-04-24',
    status: 'Need Revision'
  },
  {
    id: 'lead-003',
    company: 'PT Garuda Sistem Integrasi',
    currentStage: 'ENGAGEMENT_LETTER',
    stageProgress: 'Awaiting Signature',
    processedBy: 'Raka Pratama',
    processedAt: '2026-04-18T10:00:00.000Z',
    nextAction: 'Follow up signature',
    dueDate: '2026-04-22',
    status: 'Ready for Handover'
  },
  {
    id: 'lead-004',
    company: 'PT Delta Mandiri Persada',
    currentStage: 'MEETING',
    stageProgress: 'Rescheduled',
    processedBy: 'Nadia Putri',
    processedAt: '2026-04-17T08:40:00.000Z',
    nextAction: 'Reschedule meeting',
    dueDate: '2026-04-21',
    status: 'Need Follow Up'
  },
  {
    id: 'lead-005',
    company: 'PT Solusi Retail Indonesia',
    currentStage: 'NOTULENSI',
    stageProgress: 'Revision Needed',
    processedBy: 'Reza Akbar',
    processedAt: '2026-04-16T15:10:00.000Z',
    nextAction: 'Revise notulensi',
    dueDate: '2026-04-25',
    status: 'Need Revision'
  },
  {
    id: 'lead-006',
    company: 'PT Cipta Karya Mandiri',
    currentStage: 'PROPOSAL',
    stageProgress: 'Client Reviewing',
    processedBy: 'Yusuf Pratama',
    processedAt: '2026-04-15T11:35:00.000Z',
    nextAction: 'Follow up client feedback',
    dueDate: '2026-04-26',
    status: 'On Track'
  }
];
