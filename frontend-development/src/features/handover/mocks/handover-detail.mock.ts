import type { HandoverDetail } from '../types/handover.types';

export const handoverDetailMock: HandoverDetail = {
  id: 'ho-001',
  docCode: 'BD-HO-PT-MSM-2025-003',
  confidentiality: 'Strictly Confidential',
  projectStatus: 'Active Project',
  title: 'DSK GLOBAL - PROJECT HANDOVER MEMO',
  subtitle: 'Menampilkan memo handover proyek secara lengkap.',
  projectInformation: [
    { label: 'Client Name', value: 'PT Maju Sejahtera Manufacturing (PT MSM)' },
    { label: 'Company Group', value: 'MSM Automotive Group - Indonesia, Singapore, Thailand' },
    { label: 'Project Title', value: 'Transfer Pricing Documentation (Master File & Local File) - FY 2024' },
    { label: 'Service Line', value: 'Transfer Pricing' },
    { label: 'Project Period', value: 'Januari - Maret 2025' },
    { label: 'PIC Client', value: 'Bapak Andi Prasetyo - Finance Director' },
    { label: 'Client Contact', value: 'andi.prasetyo@msm.co.id', accent: 'primary' },
    { label: 'Engagement Letter Status', value: 'Signed - 26 Januari 2025', accent: 'success' },
    { label: 'Proposal Reference', value: 'BD-PRO-2025-021' }
  ],
  backgroundSummary:
    'PT MSM merupakan perusahaan manufaktur komponen otomotif dengan transaksi afiliasi yang signifikan, melibatkan entitas di Singapura (pembelian bahan baku) dan Thailand (jasa manajemen). Pada meeting tanggal 24 Januari 2025, klien menyampaikan kebutuhan untuk menyusun Master File dan Local File Tahun Pajak 2024 dengan kualitas yang lebih komprehensif dibandingkan tahun sebelumnya. Klien mengalami review KPP pada tahun sebelumnya sehingga menginginkan dokumentasi yang lebih kuat, lengkap, dan sesuai praktik internasional.',
  scopeIncluded: [
    'Master File (Global Group Context)',
    'Local File (Specific for ID entity)',
    'Benchmarking Analysis (Database Search)',
    'TP Risk Review',
    'Final Presentation to Management'
  ],
  scopeExcluded: ['Country-by-Country (CbC) Report', 'Prior Year Audits/Reviews', 'Extra Ad-hoc Consultations'],
  deliverables: ['Master File PDF', 'Local File ID-EN', 'Benchmarking Study Report', 'Executive Presentation Slides'],
  timelineMilestones: [
    { milestone: 'Kick-off Meeting', targetDate: '05 Feb 2025', notes: 'Meeting with Finance & Operations' },
    { milestone: 'Data Collection End', targetDate: '15 Feb 2025', notes: 'Dependent on Client availability' },
    { milestone: 'Draft Submission', targetDate: '10 Mar 2025', notes: 'Internal review before sharing' },
    { milestone: 'Final Delivery', targetDate: '25 Mar 2025', notes: 'Final signed documents' }
  ],
  feeItems: [
    { item: 'Professional Fee', amount: '350,000,000', notes: 'Fixed fee for scope defined in section 3.1' },
    { item: 'Out of Pocket Expenses', amount: 'At Cost', notes: 'Capped at 5% of professional fee' }
  ],
  paymentTerms:
    '30% downpayment upon signing, 40% upon draft submission, 30% upon final report delivery. Payments due within 14 days of invoice date.',
  clientDocuments: [
    'Group Organization Chart',
    'Audited Financial Statements (ID entity)',
    'Intercompany Agreements (Master Agreements)'
  ],
  storageLocation: '/sharepoint/projects/2025/MSM/HO',
  outstandingData: [
    'Detailed Inventory of Cross-Border Transactions',
    'Functional Analysis Questionnaires (Operations Team)',
    'Royalty Valuation Report (Singapore Entity)'
  ],
  confidentialNote:
    'The client has significant royalty payments to a Singapore entity not benchmarked in the last 3 years. This is a high-risk area for local tax audit and should be handled carefully in communications.',
  keyRisks: ['Aggressive Royalty Structure', 'Limited Operational Data Availability'],
  communicationProtocol: [
    'Weekly internal status check every Monday at 9 AM.',
    'Partner must be CCd on all major client deliverables.'
  ],
  communicationContacts: [
    {
      role: 'Primary Liaison',
      name: 'Andi Prasetyo',
      contact: 'andi.p@msm.co.id',
      instruction: 'All formal requests'
    },
    {
      role: 'Data Access',
      name: 'Siti Aminah',
      contact: 'siti.a@msm.co.id',
      instruction: 'Financial data only'
    }
  ],
  teamAssignments: [
    { role: 'Project Director', name: 'Bambang Wijaya', responsibilities: 'High-level strategy, partner sign-off' },
    { role: 'Project Manager', name: 'Ratna Sari', responsibilities: 'Day-to-day management, client contact' },
    { role: 'Lead Consultant', name: 'Denny Putra', responsibilities: 'Benchmarking and technical review' }
  ],
  checklist: [
    { label: 'Conflict of Interest Clearance', status: 'SUCCESS', text: 'YES / SUCCESS' },
    { label: 'Engagement Letter Signed', status: 'SUCCESS', text: 'YES / SUCCESS' },
    { label: 'Client Background Check', status: 'SUCCESS', text: 'YES / SUCCESS' },
    { label: 'KYC Documents Received', status: 'INFO', text: 'PARTIAL / INFO' },
    { label: 'Budget Approval', status: 'SUCCESS', text: 'YES / SUCCESS' },
    { label: 'Final Team Allocation', status: 'WARNING', text: 'PENDING / WARNING' }
  ],
  signOff: [
    { name: 'Ferry Irawan', role: 'Chief Operating Officer' },
    { name: 'Galih Gumilang', role: 'Chief Executive Officer' }
  ],
  documentControl: {
    versionControl: 'v1.0 (Final Handover)',
    storagePolicy: 'Permanent Archive (7 Years)',
    confidentialityTier: 'Tier 1 - Executive Access Only'
  }
};
