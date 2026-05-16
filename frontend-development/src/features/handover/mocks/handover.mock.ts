import type { HandoverItem } from '../types/handover.types';

export const handoverMock: HandoverItem[] = [
  {
    id: 'ho-001',
    docCode: 'BD-HO-PT-MSM-2025-003',
    client: 'PT Maju Sejahtera Manufacturing (PT MSM)',
    project: 'Transfer Pricing Documentation (Master File & Local File) - FY 2024',
    serviceLine: 'Transfer Pricing',
    period: 'Januari - Maret 2025',
    engagementStatus: 'Signed',
    engagementStatusDate: '26 Jan 2025',
    status: 'Waiting CEO Approval',
    createdBy: 'Budi Santoso',
    createdAt: '2025-01-28T08:00:00.000Z'
  },
  {
    id: 'ho-002',
    docCode: 'AD-HO-BANK-CIMB-2025-012',
    client: 'Bank CIMB Niaga Tbk',
    project: 'Annual Corporate Income Tax Compliance - FY 2024',
    serviceLine: 'Tax',
    period: 'Februari - April 2025',
    engagementStatus: 'Pending',
    engagementStatusDate: 'N/A',
    status: 'Draft',
    createdBy: '—',
    createdAt: null
  },
  {
    id: 'ho-003',
    docCode: 'TX-HO-GOTO-2025-008',
    client: 'GoTo Gojek Tokopedia',
    project: 'Cross-border VAT Advisory for Digital Services',
    serviceLine: 'Advisory',
    period: 'Januari 2025',
    engagementStatus: 'Signed',
    engagementStatusDate: '15 Jan 2025',
    status: 'Approved',
    createdBy: 'Dewi Lestari',
    createdAt: '2025-01-20T10:30:00.000Z'
  },
  {
    id: 'ho-004',
    docCode: 'AU-HO-TELK-2025-045',
    client: 'PT Telkom Indonesia Tbk',
    project: 'Interim Financial Audit Review Q1 2025',
    serviceLine: 'Audit',
    period: 'Maret - April 2025',
    engagementStatus: 'Pending',
    engagementStatusDate: 'Awaiting Client',
    status: 'Draft',
    createdBy: '—',
    createdAt: null
  },
  {
    id: 'ho-005',
    docCode: 'TX-HO-INDF-2025-019',
    client: 'PT Indofood CBP Sukses Makmur',
    project: 'Strategic Tax Restructuring & Acquisition Support',
    serviceLine: 'Advisory',
    period: 'Januari - Juni 2025',
    engagementStatus: 'Signed',
    engagementStatusDate: '05 Jan 2025',
    status: 'Assigned to PM',
    createdBy: 'Rina Wijaya',
    createdAt: '2025-01-10T14:00:00.000Z'
  },
  {
    id: 'ho-006',
    docCode: 'BD-HO-PT-TOYO-2025-061',
    client: 'Toyota Manufacturing Indonesia',
    project: 'Transfer Pricing Benchmarking Analysis Update',
    serviceLine: 'Transfer Pricing',
    period: 'April - Mei 2025',
    engagementStatus: 'Signed',
    engagementStatusDate: '20 Jan 2025',
    status: 'Draft',
    createdBy: '—',
    createdAt: null
  }
];
