import type { LeadWorkspaceEngagementLetterItem } from '../../lead-workspace/types/lead-workspace.types';
import type { LeadWorkspaceProposalView } from '../../lead-workspace/types/lead-proposals.types';
import type { ApprovalItem } from '../types/approval.types';

export const proposalApprovalsMock: ApprovalItem[] = [
  {
    id: 'apv-prop-001',
    kind: 'Proposal',
    sourceId: 'lead-002',
    docCode: 'BD-PROP-PRT-2026-002',
    client: 'CV Prima Tekno',
    title: 'Transfer Pricing Documentation Engagement',
    serviceLine: 'Transfer Pricing',
    submittedBy: 'Laras Wijaya',
    submittedAt: '2026-04-22T10:30:00.000Z',
    summary: 'Phased rollout, two-week validation gates, total fee covers FY 2024–2025.',
    detailRoute: '/lead-workspace/lead-002/proposal'
  },
  {
    id: 'apv-prop-002',
    kind: 'Proposal',
    sourceId: 'lead-005',
    docCode: 'BD-PROP-SRI-2026-005',
    client: 'PT Solusi Retail Indonesia',
    title: 'Annual Tax Compliance & Advisory Retainer',
    serviceLine: 'Tax',
    submittedBy: 'Andi Setiawan',
    submittedAt: '2026-04-23T09:15:00.000Z',
    summary: 'Monthly retainer model, includes ad-hoc advisory hours and year-end CIT.',
    detailRoute: '/lead-workspace/lead-005/proposal'
  }
];

export const engagementLetterApprovalsMock: ApprovalItem[] = [
  {
    id: 'apv-el-001',
    kind: 'EngagementLetter',
    sourceId: 'lead-003',
    docCode: 'BD-EL-GSI-2026-003',
    client: 'PT Garuda Sistem Integrasi',
    title: 'Engagement Letter — Transfer Pricing Advisory',
    serviceLine: 'Transfer Pricing',
    submittedBy: 'Raka Pratama',
    submittedAt: '2026-04-21T14:00:00.000Z',
    summary: 'Client requested clause adjustment on confidentiality and IP ownership.',
    detailRoute: '/lead-workspace/lead-003/engagement-letter'
  },
  {
    id: 'apv-el-002',
    kind: 'EngagementLetter',
    sourceId: 'lead-001',
    docCode: 'BD-EL-ADV-2026-001',
    client: 'PT Nusantara Digital',
    title: 'Engagement Letter — Strategic Tax Advisory',
    serviceLine: 'Tax Advisory',
    submittedBy: 'Maria Veronica',
    submittedAt: '2026-04-20T11:20:00.000Z',
    summary: 'Retainer structure with milestone billing and subcon disclosure.',
    detailRoute: '/lead-workspace/lead-001/engagement-letter'
  }
];

export const handoverApprovalsMock: ApprovalItem[] = [
  {
    id: 'apv-ho-001',
    kind: 'HandoverMemo',
    sourceId: 'ho-001',
    docCode: 'BD-HO-PT-MSM-2025-003',
    client: 'PT Maju Sejahtera Manufacturing (PT MSM)',
    title: 'Transfer Pricing Documentation (Master File & Local File) - FY 2024',
    serviceLine: 'Transfer Pricing',
    submittedBy: 'BD Team',
    submittedAt: '2026-04-25T08:00:00.000Z',
    summary: 'Handover memo for Transfer Pricing engagement, awaiting CEO sign-off.',
    detailRoute: '/handover/ho-001'
  }
];

export const approvalProposalDetailsMock: Record<string, LeadWorkspaceProposalView> = {
  'apv-prop-001': {
    id: '101',
    leadId: '2',
    serviceId: '12',
    serviceName: 'Transfer Pricing Documentation',
    serviceCode: 'TP-DOC',
    serviceClassId: '3',
    serviceClassName: 'Transfer Pricing',
    serviceClassCode: 'TP',
    departmentId: '4',
    issuerCompany: 'DSK',
    isSubContract: false,
    partnerName: null,
    payerParty: null,
    proposalFee: 185000000,
    discountAmount: 15000000,
    status: 'WAITING_CEO_APPROVAL',
    revisionNote: null,
    submittedByName: 'Laras Wijaya',
    submittedAt: '2026-04-22T10:30:00.000Z',
    createdByName: 'Laras Wijaya',
    createdAt: '2026-04-20T09:00:00.000Z',
    updatedAt: '2026-04-22T10:30:00.000Z',
    document: {
      id: '501',
      documentName: 'Proposal Transfer Pricing CV Prima Tekno.pdf',
      fileName: 'proposal-prima-tekno.pdf',
      filePath: '/uploads/proposals/proposal-prima-tekno.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 2457600,
      versionNo: 1,
      uploadedByName: 'Laras Wijaya',
      createdAt: '2026-04-21T16:45:00.000Z'
    }
  },
  'apv-prop-002': {
    id: '102',
    leadId: '5',
    serviceId: '8',
    serviceName: 'Annual Tax Compliance & Advisory',
    serviceCode: 'TAX-ANN',
    serviceClassId: '2',
    serviceClassName: 'Tax',
    serviceClassCode: 'TAX',
    departmentId: '2',
    issuerCompany: 'DTAX',
    isSubContract: true,
    partnerName: 'PT Mitra Konsultan Pajak',
    payerParty: 'CLIENT',
    proposalFee: 96000000,
    discountAmount: 6000000,
    status: 'WAITING_CEO_APPROVAL',
    revisionNote: null,
    submittedByName: 'Andi Setiawan',
    submittedAt: '2026-04-23T09:15:00.000Z',
    createdByName: 'Andi Setiawan',
    createdAt: '2026-04-22T14:20:00.000Z',
    updatedAt: '2026-04-23T09:15:00.000Z',
    document: {
      id: '502',
      documentName: 'Proposal Tax Retainer Solusi Retail.pdf',
      fileName: 'proposal-solusi-retail.pdf',
      filePath: '/uploads/proposals/proposal-solusi-retail.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1984512,
      versionNo: 1,
      uploadedByName: 'Andi Setiawan',
      createdAt: '2026-04-22T18:10:00.000Z'
    }
  }
};

const garudaEngagementLetters: LeadWorkspaceEngagementLetterItem[] = [
  {
    id: 'el-gs-001',
    title: 'Master Service Agreement',
    serviceName: 'Transfer Pricing Advisory',
    createdAt: '2026-04-21T14:00:00.000Z',
    agreeFee: 'IDR 1.250.000.000',
    paymentTypeFinal: 'Milestone Based (30-40-30)',
    hasSubcon: false,
    status: 'PENDING',
    document: {
      uploadedFileName: 'EL_Garuda_TP_Advisory_v1.pdf',
      uploadedAt: '2026-04-21T14:30:00.000Z',
      uploadedSize: '2.1 MB'
    }
  },
  {
    id: 'el-gs-002',
    title: 'Amendment A - Scope Extension',
    serviceName: 'Transfer Pricing Advisory',
    createdAt: '2026-04-19T10:45:00.000Z',
    agreeFee: 'IDR 450.000.000',
    paymentTypeFinal: 'Two Terms',
    hasSubcon: true,
    status: 'REPLACED',
    document: {}
  }
];

const nusantaraEngagementLetters: LeadWorkspaceEngagementLetterItem[] = [
  {
    id: 'el-nd-001',
    title: 'Strategic Tax Advisory Engagement',
    serviceName: 'Strategic Tax Advisory',
    createdAt: '2026-04-20T11:20:00.000Z',
    agreeFee: 'IDR 875.000.000',
    paymentTypeFinal: 'Monthly Retainer',
    hasSubcon: false,
    status: 'PENDING',
    document: {
      uploadedFileName: 'EL_Nusantara_Strategic_Tax.pdf',
      uploadedAt: '2026-04-20T12:00:00.000Z',
      uploadedSize: '1.8 MB'
    }
  }
];

export const approvalEngagementLetterDetailsMock: Record<string, LeadWorkspaceEngagementLetterItem[]> = {
  'apv-el-001': garudaEngagementLetters,
  'apv-el-002': nusantaraEngagementLetters
};
