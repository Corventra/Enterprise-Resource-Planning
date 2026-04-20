import type { BankDataEntry } from '../types/bank-data.types';

export const bankDataMock: BankDataEntry[] = [
  {
    id: 'bd-001',
    submittedAt: '2026-04-19T08:35:00.000Z',
    companyName: 'PT Nusantara Logistik',
    contactName: 'Andi Setiawan',
    contactEmail: 'andi@nusantaralogistik.co.id',
    contactPhone: '+62 812-1111-2233',
    source: 'LinkedIn',
    entrySlug: 'nusantara-logistik-q2',
    campaignName: 'Q2 SME Acquisition Drive',
    formName: 'SME Lead Qualification Form',
    status: 'New'
  },
  {
    id: 'bd-002',
    submittedAt: '2026-04-18T14:12:00.000Z',
    companyName: 'CV Prima Tekno',
    contactName: 'Laras Wijaya',
    contactEmail: 'laras@primatekno.id',
    contactPhone: '+62 877-3311-8899',
    source: 'Website',
    entrySlug: 'prima-tekno-demo',
    campaignName: 'Q2 SME Acquisition Drive',
    formName: 'Consultation Booking Form',
    status: 'Processed'
  },
  {
    id: 'bd-003',
    submittedAt: '2026-04-17T09:05:00.000Z',
    companyName: 'PT Anugerah Sejahtera',
    contactName: 'Budi Santoso',
    contactEmail: 'budi@anugerahsejahtera.com',
    contactPhone: '+62 821-9988-7766',
    source: 'Instagram',
    entrySlug: 'anugerah-sejahtera-ig',
    campaignName: 'Brand Awareness Ramadan',
    formName: 'Awareness Feedback Form',
    status: 'Archived'
  },
  {
    id: 'bd-004',
    submittedAt: '2026-04-16T11:28:00.000Z',
    companyName: 'PT Cipta Karya Mandiri',
    contactName: 'Nadia Putri',
    contactEmail: 'nadia@ciptakarya.co.id',
    contactPhone: '+62 878-4545-1299',
    source: 'Email',
    entrySlug: 'cipta-karya-referral',
    campaignName: 'Payroll Service Reactivation',
    formName: 'Payroll Upgrade Form',
    status: 'Processed'
  },
  {
    id: 'bd-005',
    submittedAt: '2026-04-15T15:44:00.000Z',
    companyName: 'PT Solusi Retail Indonesia',
    contactName: 'Reza Akbar',
    contactEmail: 'reza@solusiretail.id',
    contactPhone: '+62 812-7000-3344',
    source: 'WhatsApp',
    entrySlug: 'solusi-retail-wa',
    campaignName: 'Landing Page Optimization',
    formName: 'Landing Page Interest Form',
    status: 'New'
  },
  {
    id: 'bd-006',
    submittedAt: '2026-04-14T13:20:00.000Z',
    companyName: 'PT Garuda Sistem Integrasi',
    contactName: 'Yusuf Pratama',
    contactEmail: 'yusuf@garudasistem.com',
    contactPhone: '+62 813-2121-8890',
    source: 'LinkedIn',
    entrySlug: 'garuda-sistem-linkedin',
    campaignName: 'Enterprise Outbound Pilot',
    formName: 'SME Lead Qualification Form',
    status: 'Archived'
  }
];
