import type { KpiSnapshot } from '../types/kpi.types';

/**
 * Historical KPI snapshots untuk demo trend di Consultant KPI Dashboard.
 * 3 period historis untuk consultant@erp.local (Feb–Apr 2026).
 * Period saat ini (Apr 2026) preliminary (belum finalized).
 *
 * Untuk pm.senior@erp.local (Rina Kartika) ada 1 snapshot Feb 2026 (saat
 * prj-003 selesai sebagai PM) — sebagai dummy variasi data, walau PM tidak
 * di-KPI-kan secara default (skripsi fokus consultant).
 */
export const kpiSnapshotsMock: KpiSnapshot[] = [
  {
    consultantId: 'consultant@erp.local',
    consultantName: 'Consultant User',
    period: '2026-02',
    computedAt: '2026-03-01T08:00:00.000Z',
    finalizedAt: '2026-03-05T10:00:00.000Z',
    finalizedBy: { id: 'ceo@erp.local', name: 'CEO User', role: 'CEO' },
    dimensions: {
      taskCompletion: {
        weight: 0.35,
        capaian: 80,
        rawValue: 0.8,
        contributingTaskIds: ['mil-003-1', 'mil-003-2']
      },
      timeliness: {
        weight: 0.25,
        capaian: 100,
        rawValue: 1.0,
        contributingTaskIds: ['mil-003-1', 'mil-003-2']
      },
      updateCompliance: {
        weight: 0.15,
        capaian: 60,
        rawValue: 5,
        contributingTaskIds: ['mil-003-1', 'mil-003-2']
      },
      outputQuality: {
        weight: 0.25,
        capaian: 90,
        rawValue: 4.5,
        contributingTaskIds: ['mil-003-1', 'mil-003-2']
      }
    },
    total: 80,
    contributingProjectIds: ['prj-003']
  },
  {
    consultantId: 'consultant@erp.local',
    consultantName: 'Consultant User',
    period: '2026-03',
    computedAt: '2026-04-01T08:00:00.000Z',
    finalizedAt: '2026-04-05T10:00:00.000Z',
    finalizedBy: { id: 'ceo@erp.local', name: 'CEO User', role: 'CEO' },
    dimensions: {
      taskCompletion: {
        weight: 0.35,
        capaian: 50,
        rawValue: 0.5,
        contributingTaskIds: ['mil-002-1', 'mil-002-2']
      },
      timeliness: {
        weight: 0.25,
        capaian: 100,
        rawValue: 1.0,
        contributingTaskIds: ['mil-002-1']
      },
      updateCompliance: {
        weight: 0.15,
        capaian: 75,
        rawValue: 4,
        contributingTaskIds: ['mil-002-1', 'mil-002-2']
      },
      outputQuality: {
        weight: 0.25,
        capaian: 100,
        rawValue: 5,
        contributingTaskIds: ['mil-002-1']
      }
    },
    total: 78.75,
    contributingProjectIds: ['prj-002']
  }
];
