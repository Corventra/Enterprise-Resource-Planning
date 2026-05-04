import type { TaskTemplate } from '../types/project.types';

/**
 * Default task templates per Service Line. Sum of `weight` per template = 100
 * (memudahkan kalkulasi KPI Task Completion). Akan di-edit collaborative oleh
 * HRD + COO via Settings → Task Templates di Step 6f.
 *
 * Transfer Pricing template mirror screenshot referensi tesis (10 tasks).
 */
export const taskTemplatesMock: TaskTemplate[] = [
  {
    id: 'tpl-tp-default',
    serviceLine: 'Transfer Pricing',
    name: 'TP Standard 2026',
    isDefault: true,
    tasks: [
      { title: 'Permintaan Dokumen', weight: 5, phase: 'Initiation', expectedDurationDays: 3 },
      { title: 'Kelengkapan Dokumen', weight: 8, phase: 'Initiation', expectedDurationDays: 7 },
      { title: 'Gambaran Perusahaan', weight: 8, phase: 'Analysis', expectedDurationDays: 5 },
      { title: 'Informasi Transaksi Afiliasi', weight: 10, phase: 'Analysis', expectedDurationDays: 7 },
      { title: 'Analisis FAR', weight: 15, phase: 'Core Work', expectedDurationDays: 14 },
      { title: 'Pemilihan Metode', weight: 12, phase: 'Core Work', expectedDurationDays: 7 },
      { title: 'Penerapan ALP', weight: 12, phase: 'Core Work', expectedDurationDays: 14 },
      { title: 'Quality Control', weight: 15, phase: 'QC', expectedDurationDays: 7 },
      { title: 'Kirim Draft ke Klien', weight: 8, phase: 'Delivery', expectedDurationDays: 3 },
      { title: 'Kirim Net ke Klien', weight: 7, phase: 'Delivery', expectedDurationDays: 7 }
    ]
  },
  {
    id: 'tpl-tax-default',
    serviceLine: 'Tax',
    name: 'Tax Compliance Standard',
    isDefault: true,
    tasks: [
      { title: 'Document Collection', weight: 5, phase: 'Initiation', expectedDurationDays: 5 },
      { title: 'Tax Position Review', weight: 10, phase: 'Analysis', expectedDurationDays: 7 },
      { title: 'Compliance Calculation', weight: 20, phase: 'Core Work', expectedDurationDays: 14 },
      { title: 'Form Preparation', weight: 15, phase: 'Core Work', expectedDurationDays: 7 },
      { title: 'Internal Review', weight: 10, phase: 'QC', expectedDurationDays: 5 },
      { title: 'Quality Control', weight: 10, phase: 'QC', expectedDurationDays: 5 },
      { title: 'Client Review', weight: 15, phase: 'Delivery', expectedDurationDays: 7 },
      { title: 'Final Filing', weight: 15, phase: 'Delivery', expectedDurationDays: 5 }
    ]
  },
  {
    id: 'tpl-advisory-default',
    serviceLine: 'Advisory',
    name: 'Advisory Engagement Standard',
    isDefault: true,
    tasks: [
      { title: 'Discovery & Scoping', weight: 10, phase: 'Initiation', expectedDurationDays: 7 },
      { title: 'Stakeholder Interviews', weight: 15, phase: 'Analysis', expectedDurationDays: 7 },
      { title: 'Issue Identification', weight: 15, phase: 'Analysis', expectedDurationDays: 7 },
      { title: 'Solution Design', weight: 20, phase: 'Core Work', expectedDurationDays: 10 },
      { title: 'Recommendation Drafting', weight: 15, phase: 'Core Work', expectedDurationDays: 10 },
      { title: 'Internal Review', weight: 10, phase: 'QC', expectedDurationDays: 5 },
      { title: 'Final Presentation', weight: 15, phase: 'Delivery', expectedDurationDays: 7 }
    ]
  },
  {
    id: 'tpl-audit-default',
    serviceLine: 'Audit',
    name: 'Audit Engagement Standard',
    isDefault: true,
    tasks: [
      { title: 'Engagement Acceptance', weight: 5, phase: 'Initiation', expectedDurationDays: 3 },
      { title: 'Audit Planning', weight: 10, phase: 'Initiation', expectedDurationDays: 5 },
      { title: 'Risk Assessment', weight: 10, phase: 'Analysis', expectedDurationDays: 7 },
      { title: 'Substantive Testing', weight: 25, phase: 'Core Work', expectedDurationDays: 21 },
      { title: 'Working Paper Review', weight: 15, phase: 'Core Work', expectedDurationDays: 7 },
      { title: 'Quality Control', weight: 15, phase: 'QC', expectedDurationDays: 7 },
      { title: 'Audit Report Drafting', weight: 10, phase: 'Delivery', expectedDurationDays: 7 },
      { title: 'Final Report', weight: 10, phase: 'Delivery', expectedDurationDays: 3 }
    ]
  }
];
