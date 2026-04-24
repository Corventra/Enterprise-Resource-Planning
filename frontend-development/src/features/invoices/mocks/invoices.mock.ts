import type { InvoiceDetail, InvoiceItem } from '../types/invoice.types';

export const invoicesMock: InvoiceItem[] = [
  {
    id: 'inv-001',
    invoiceCode: 'INV-001/DSK/WD/2025',
    projectCode: 'PRJ-DSK-001',
    clientName: 'PT Maju Jaya',
    serviceType: 'Web Dev',
    contractValue: 30000000,
    totalInvoice: 33300000,
    settledValue: 33300000,
    outstandingValue: 0,
    nextDueDate: null,
    paymentStatus: 'Paid',
    paymentProgress: 100
  },
  {
    id: 'inv-002',
    invoiceCode: 'INV-092/ENT/TX/2024',
    projectCode: 'PRJ-ENT-092',
    clientName: 'Global Solusindo',
    serviceType: 'Tax',
    contractValue: 125000000,
    totalInvoice: 138750000,
    settledValue: 45000000,
    outstandingValue: 93750000,
    nextDueDate: '2024-09-01',
    paymentStatus: 'Overdue',
    paymentProgress: 32
  },
  {
    id: 'inv-003',
    invoiceCode: 'INV-204/KRT/WD/2025',
    projectCode: 'PRJ-KRT-204',
    clientName: 'Karta Kreatif',
    serviceType: 'Web Dev',
    contractValue: 15000000,
    totalInvoice: 16650000,
    settledValue: 0,
    outstandingValue: 16650000,
    nextDueDate: null,
    paymentStatus: 'Pending Verification',
    paymentProgress: 0
  },
  {
    id: 'inv-004',
    invoiceCode: 'INV-210/GOJ/WD/2025',
    projectCode: 'PRJ-GOJ-210',
    clientName: 'Gojek Indonesia',
    serviceType: 'Maintenance',
    contractValue: 120000000,
    totalInvoice: 133200000,
    settledValue: 90000000,
    outstandingValue: 43200000,
    nextDueDate: '2025-10-22',
    paymentStatus: 'Partially Paid',
    paymentProgress: 67
  },
  {
    id: 'inv-005',
    invoiceCode: 'INV-215/MDR/SEC/2025',
    projectCode: 'PRJ-MDR-215',
    clientName: 'Bank Mandiri',
    serviceType: 'Security',
    contractValue: 75000000,
    totalInvoice: 83250000,
    settledValue: 0,
    outstandingValue: 83250000,
    nextDueDate: '2025-11-05',
    paymentStatus: 'Sent',
    paymentProgress: 0
  },
  {
    id: 'inv-006',
    invoiceCode: 'INV-DRAFT/552',
    projectCode: 'PRJ-TLK-552',
    clientName: 'Telkom Indonesia',
    serviceType: 'Consulting',
    contractValue: 85000000,
    totalInvoice: 94350000,
    settledValue: 0,
    outstandingValue: 0,
    nextDueDate: null,
    paymentStatus: 'Draft',
    paymentProgress: 0
  },
  {
    id: 'inv-007',
    invoiceCode: 'INV-012/CXL/APP/2024',
    projectCode: 'PRJ-CXL-012',
    clientName: 'Umbrella Corp',
    serviceType: 'App Dev',
    contractValue: 250000000,
    totalInvoice: 277500000,
    settledValue: 0,
    outstandingValue: 0,
    nextDueDate: null,
    paymentStatus: 'Closed',
    paymentProgress: 0
  }
];

export const invoiceDetailsMock: InvoiceDetail[] = [
  {
    invoice: invoicesMock[0],
    contractSummary: {
      contractValue: 30000000,
      installmentScheme: '2 Termin (50/50)',
      engagementLetterReference: 'EL/2025/089',
      engagementLetterDate: '2025-01-12'
    },
    financialSummary: {
      dppContract: 30000000,
      grossInvoiceTotal: 33300000,
      netPaymentTotal: 32700000,
      outstandingTotal: 0,
      paymentProgress: 100
    },
    clientInfo: {
      clientId: 'MJJ-9920',
      projectName: 'Web Development Project',
      picName: 'Bpk. Andi Wijaya',
      email: 'andi.wijaya@majujaya.com',
      phone: '+62 812-3456-7890',
      address: 'Gedung Jaya Lt. 5, Jl. Thamrin No. 12, Jakarta'
    },
    installments: [
      {
        id: 'ins-001',
        number: 1,
        invoiceNumber: 'INV/MJJ/01/25',
        termName: 'Down Payment (DP)',
        percentage: 50,
        taxScheme: 'PPN + PPh 23',
        baseAmount: 15000000,
        totalInvoice: 16650000,
        settledAmount: 16650000,
        outstandingAmount: 0,
        issuedDate: '2025-01-01',
        dueDate: '2025-01-15',
        status: 'Paid'
      },
      {
        id: 'ins-002',
        number: 2,
        invoiceNumber: 'INV/MJJ/02/25',
        termName: 'Final Payment',
        percentage: 50,
        taxScheme: 'PPN + PPh 23',
        baseAmount: 15000000,
        totalInvoice: 16650000,
        settledAmount: 16650000,
        outstandingAmount: 0,
        issuedDate: '2025-09-15',
        dueDate: '2025-10-10',
        status: 'Paid'
      }
    ],
    paymentHistory: [
      {
        id: 'pay-001',
        transactionDate: '2025-10-15',
        installmentName: 'Final Payment',
        amountReceived: 16350000,
        pph23Amount: 300000,
        taxScheme: 'PPN + PPh 23',
        settledAmount: 16650000,
        method: 'Bank Transfer (BCA)',
        verifiedBy: 'Sarah Admin',
        status: 'Verified'
      },
      {
        id: 'pay-002',
        transactionDate: '2025-01-12',
        installmentName: 'Down Payment (DP)',
        amountReceived: 16350000,
        pph23Amount: 300000,
        taxScheme: 'PPN + PPh 23',
        settledAmount: 16650000,
        method: 'Bank Transfer (BCA)',
        verifiedBy: 'Sarah Admin',
        status: 'Verified'
      }
    ],
    timeline: [
      {
        id: 'tl-001',
        title: 'Pembayaran Termin 2 Diverifikasi',
        description: '15 Okt 2025 • Oleh Sarah Admin',
        type: 'verified'
      },
      {
        id: 'tl-002',
        title: 'Invoice Termin 2 Terbit',
        description: '15 Sep 2025 • Oleh System',
        type: 'invoice'
      },
      {
        id: 'tl-003',
        title: 'Pembayaran Termin 1 Diverifikasi',
        description: '12 Jan 2025 • Oleh Sarah Admin',
        type: 'verified'
      }
    ],
    relatedDocuments: [
      { id: 'doc-001', name: 'EL - PT Maju Jaya.pdf', type: 'pdf' },
      { id: 'doc-002', name: 'Invoice Termin 1.pdf', type: 'invoice' },
      { id: 'doc-003', name: 'Faktur Pajak - JAN.pdf', type: 'tax' }
    ],
    internalNote:
      'Client cukup responsif dan selalu membayar tepat waktu. Follow-up berikutnya fokus ke peluang maintenance kontrak lanjutan.',
    internalNoteUpdatedAt: '2025-10-15'
  }
];
