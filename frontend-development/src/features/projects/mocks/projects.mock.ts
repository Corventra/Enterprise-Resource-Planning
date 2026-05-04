import type { Project } from '../types/project.types';

/**
 * Dummy users mirror `auth.service.ts` DUMMY_ACCOUNTS — emails are used as ids.
 * pm@erp.local owns prj-001 & prj-002. consultant@erp.local works on prj-002 & prj-003.
 * prj-003 has a different (unloggable) PM to vary the data.
 *
 * Milestones di-enrich dengan KPI fields (weight, updateLog, completedAt, qualityRating)
 * sesuai Step 6b. Weight per milestone dipilih agar sum per project = 100 untuk
 * memudahkan kalkulasi KPI Task Completion.
 */
export const projectsMock: Project[] = [
  {
    id: 'prj-001',
    projectCode: 'PRJ-2026-0001',
    handoverId: 'ho-005',
    client: 'PT Indofood CBP Sukses Makmur',
    projectName: 'Strategic Tax Restructuring & Acquisition Support',
    serviceLine: 'Advisory',
    status: 'Awaiting Consultant',
    pm: { id: 'pm@erp.local', name: 'PM User' },
    consultants: [],
    startDate: '2026-01-15',
    endDate: '2026-06-30',
    createdAt: '2026-04-26T10:00:00.000Z',
    milestones: [
      {
        id: 'mil-001-1',
        title: 'Project Kick-off',
        weight: 30,
        phase: 'Initiation',
        targetDate: '2026-01-20',
        status: 'Pending',
        ownerId: 'pm@erp.local',
        ownerName: 'PM User',
        notes: 'Internal alignment + intro session ke client.',
        updateLog: []
      },
      {
        id: 'mil-001-2',
        title: 'Data Room Setup',
        weight: 30,
        phase: 'Analysis',
        targetDate: '2026-02-05',
        status: 'Pending',
        ownerId: 'pm@erp.local',
        ownerName: 'PM User',
        updateLog: []
      },
      {
        id: 'mil-001-3',
        title: 'Phase 1 Tax Diagnostic',
        weight: 40,
        phase: 'Core Work',
        targetDate: '2026-03-15',
        status: 'Pending',
        ownerId: 'pm@erp.local',
        ownerName: 'PM User',
        updateLog: []
      }
    ]
  },
  {
    id: 'prj-002',
    projectCode: 'PRJ-2026-0002',
    handoverId: 'ho-003',
    client: 'GoTo Gojek Tokopedia',
    projectName: 'Cross-border VAT Advisory for Digital Services',
    serviceLine: 'Advisory',
    status: 'In Progress',
    pm: { id: 'pm@erp.local', name: 'PM User' },
    consultants: [
      { id: 'consultant@erp.local', name: 'Consultant User', level: 'Lead' },
      { id: 'consultant.junior@erp.local', name: 'Sari Anggraini', level: 'Junior' }
    ],
    startDate: '2026-01-10',
    endDate: '2026-04-30',
    createdAt: '2026-01-08T10:00:00.000Z',
    milestones: [
      {
        id: 'mil-002-1',
        title: 'Cross-border Risk Mapping',
        weight: 25,
        phase: 'Analysis',
        targetDate: '2026-02-10',
        status: 'Done',
        ownerId: 'consultant@erp.local',
        ownerName: 'Consultant User',
        completedAt: '2026-02-09T15:30:00.000Z',
        qualityRating: 5,
        revisionCount: 0,
        updateLog: [
          {
            at: '2026-01-15T09:00:00.000Z',
            byId: 'consultant@erp.local',
            byName: 'Consultant User',
            fromStatus: 'Pending',
            toStatus: 'In Progress'
          },
          {
            at: '2026-02-09T15:30:00.000Z',
            byId: 'consultant@erp.local',
            byName: 'Consultant User',
            fromStatus: 'In Progress',
            toStatus: 'Done',
            note: 'Risk register lengkap, ready for regulatory mapping.'
          }
        ]
      },
      {
        id: 'mil-002-2',
        title: 'Regulatory Inventory (ID, SG, US)',
        weight: 35,
        phase: 'Core Work',
        targetDate: '2026-03-05',
        status: 'In Progress',
        ownerId: 'consultant@erp.local',
        ownerName: 'Consultant User',
        notes: 'Menunggu konfirmasi dari counsel SG.',
        updateLog: [
          {
            at: '2026-02-10T08:00:00.000Z',
            byId: 'consultant@erp.local',
            byName: 'Consultant User',
            fromStatus: 'Pending',
            toStatus: 'In Progress'
          },
          {
            at: '2026-03-12T10:30:00.000Z',
            byId: 'consultant@erp.local',
            byName: 'Consultant User',
            fromStatus: 'In Progress',
            toStatus: 'In Progress',
            note: 'Mar progress check: ID + SG hampir final, US masih menunggu counsel feedback.'
          }
        ]
      },
      {
        id: 'mil-002-3',
        title: 'Final Advisory Memo',
        weight: 40,
        phase: 'Delivery',
        targetDate: '2026-04-15',
        status: 'Pending',
        ownerId: 'consultant@erp.local',
        ownerName: 'Consultant User',
        updateLog: []
      }
    ]
  },
  {
    id: 'prj-003',
    projectCode: 'PRJ-2025-0042',
    handoverId: 'ho-archive-001',
    client: 'PT Bumi Resources',
    projectName: 'Annual Tax Compliance Review FY2024',
    serviceLine: 'Tax',
    status: 'Completed',
    pm: { id: 'pm.senior@erp.local', name: 'Rina Kartika' },
    consultants: [{ id: 'consultant@erp.local', name: 'Consultant User', level: 'Senior' }],
    startDate: '2025-11-01',
    endDate: '2026-02-28',
    createdAt: '2025-10-30T09:00:00.000Z',
    milestones: [
      {
        id: 'mil-003-1',
        title: 'Compliance Field Work',
        weight: 35,
        phase: 'Core Work',
        targetDate: '2025-12-15',
        status: 'Done',
        ownerId: 'consultant@erp.local',
        ownerName: 'Consultant User',
        completedAt: '2025-12-14T16:00:00.000Z',
        qualityRating: 4,
        revisionCount: 1,
        updateLog: [
          {
            at: '2025-11-05T08:00:00.000Z',
            byId: 'consultant@erp.local',
            byName: 'Consultant User',
            fromStatus: 'Pending',
            toStatus: 'In Progress'
          },
          {
            at: '2025-12-14T16:00:00.000Z',
            byId: 'consultant@erp.local',
            byName: 'Consultant User',
            fromStatus: 'In Progress',
            toStatus: 'Done',
            note: 'Field work selesai, 1 revisi minor di sample selection.'
          }
        ]
      },
      {
        id: 'mil-003-2',
        title: 'Draft Compliance Report',
        weight: 35,
        phase: 'Delivery',
        targetDate: '2026-01-25',
        status: 'Done',
        ownerId: 'consultant@erp.local',
        ownerName: 'Consultant User',
        completedAt: '2026-01-23T11:00:00.000Z',
        qualityRating: 5,
        revisionCount: 0,
        updateLog: [
          {
            at: '2025-12-16T09:00:00.000Z',
            byId: 'consultant@erp.local',
            byName: 'Consultant User',
            fromStatus: 'Pending',
            toStatus: 'In Progress'
          },
          {
            at: '2026-01-23T11:00:00.000Z',
            byId: 'consultant@erp.local',
            byName: 'Consultant User',
            fromStatus: 'In Progress',
            toStatus: 'Done'
          }
        ]
      },
      {
        id: 'mil-003-3',
        title: 'Final Sign-off',
        weight: 30,
        phase: 'Delivery',
        targetDate: '2026-02-25',
        status: 'Done',
        ownerId: 'pm.senior@erp.local',
        ownerName: 'Rina Kartika',
        completedAt: '2026-02-24T17:00:00.000Z',
        qualityRating: 5,
        revisionCount: 0,
        updateLog: [
          {
            at: '2026-01-26T08:00:00.000Z',
            byId: 'pm.senior@erp.local',
            byName: 'Rina Kartika',
            fromStatus: 'Pending',
            toStatus: 'In Progress'
          },
          {
            at: '2026-02-24T17:00:00.000Z',
            byId: 'pm.senior@erp.local',
            byName: 'Rina Kartika',
            fromStatus: 'In Progress',
            toStatus: 'Done',
            note: 'Sign-off final dengan client.'
          }
        ]
      }
    ]
  }
];
