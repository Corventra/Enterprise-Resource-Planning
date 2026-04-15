import type { BankDataEntry, Submission } from '../types/campaign.types';

export const submissionsMock: Submission[] = [
  {
    id: 'sub-001',
    campaignId: 'cmp-001',
    formId: 'frm-001',
    customerName: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@alfacorp.id',
    phone: '+628112223334',
    company: 'Alfa Corp',
    submittedAt: '2026-04-14T08:10:00.000Z',
    status: 'Qualified',
    answers: {
      industry: 'Retail',
      employees: '120',
      financingNeed: 'IDR 2,000,000,000'
    }
  },
  {
    id: 'sub-002',
    campaignId: 'cmp-001',
    formId: 'frm-002',
    customerName: 'Nita Permata',
    email: 'nita@sentraboga.id',
    phone: '+628123334445',
    company: 'Sentra Boga',
    submittedAt: '2026-04-13T11:45:00.000Z',
    status: 'New',
    answers: {
      preferredTime: 'Monday 10:00',
      notes: 'Need payroll integration details'
    }
  },
  {
    id: 'sub-003',
    campaignId: 'cmp-002',
    formId: 'frm-003',
    customerName: 'Dimas Pratama',
    email: 'dimas@kinetikgroup.id',
    phone: '+628133339991',
    company: 'Kinetik Group',
    submittedAt: '2026-04-12T14:20:00.000Z',
    status: 'Qualified',
    answers: {
      branchCount: '8',
      payrollVolume: '430 employees'
    }
  },
  {
    id: 'sub-004',
    campaignId: 'cmp-005',
    formId: 'frm-005',
    customerName: 'Citra Lestari',
    email: 'citra@adimakmur.id',
    phone: '+628199992221',
    company: 'Adi Makmur',
    submittedAt: '2026-04-08T09:00:00.000Z',
    status: 'Rejected',
    answers: {
      reason: 'Budget not approved'
    }
  }
];

export const bankDataEntriesMock: BankDataEntry[] = [
  {
    id: 'bank-001',
    campaignId: 'cmp-001',
    bankName: 'BCA',
    accountName: 'PT Alfa Corp',
    accountNumber: '1234567890',
    branch: 'Jakarta Sudirman'
  },
  {
    id: 'bank-002',
    campaignId: 'cmp-002',
    bankName: 'Mandiri',
    accountName: 'PT Kinetik Group',
    accountNumber: '9988776655',
    branch: 'Bandung Asia Afrika'
  },
  {
    id: 'bank-003',
    campaignId: 'cmp-005',
    bankName: 'BNI',
    accountName: 'PT Adi Makmur',
    accountNumber: '0011223344',
    branch: 'Surabaya Darmo'
  }
];
