import { mapLeadWorkspaceProposalRow } from '../../lead-workspace/services/lead-proposals-service';
import type { LeadWorkspaceProposalView } from '../../lead-workspace/types/lead-proposals.types';
import type { ApprovalItem, ApprovalProposalLeadSummary } from '../types/approval.types';
import {
  approvePendingProposal,
  getPendingProposalApprovalDetail,
  getPendingProposalApprovals,
  rejectPendingProposal,
  type ApiApprovalProposalLeadSummaryRow,
  type ApiPendingProposalListRow
} from './approval-proposals-api';

const mapLeadSummaryRow = (row: ApiApprovalProposalLeadSummaryRow): ApprovalProposalLeadSummary => ({
  companyName: row.company_name,
  picName: row.pic_name,
  email: row.email,
  phoneNumber: row.phone_number,
  leadSourceLabel: row.lead_source_label,
  processedByName: row.processed_by_name,
  processedAt: row.processed_at,
  desiredServices: row.desired_services
});

const mapPendingProposalRow = (row: ApiPendingProposalListRow): LeadWorkspaceProposalView => ({
  id: String(row.proposal_id),
  leadId: String(row.lead_id),
  serviceId: '',
  serviceName: row.service_name,
  serviceCode: '',
  serviceClassId: '',
  serviceClassName: row.service_class_name,
  serviceClassCode: '',
  departmentId: '',
  issuerCompany: row.issuer_company,
  isSubContract: false,
  partnerName: null,
  payerParty: null,
  proposalFee: Number(row.proposal_fee),
  discountAmount: Number(row.discount_amount),
  status: row.proposal_status,
  revisionNote: null,
  submittedByName: row.submitted_by_name,
  submittedAt: row.submitted_at,
  createdByName: null,
  createdAt: row.submitted_at ?? new Date().toISOString(),
  updatedAt: row.submitted_at ?? new Date().toISOString(),
  document: row.document
    ? {
        id: String(row.document.document_id),
        documentName: row.document.document_name,
        fileName: row.document.file_name,
        filePath: row.document.file_path,
        mimeType: row.document.mime_type,
        fileSizeBytes: row.document.file_size_bytes,
        versionNo: row.document.version_no,
        uploadedByName: row.document.uploaded_by_name,
        createdAt: row.document.created_at
      }
    : null
});

const mapPendingProposalToApprovalItem = (row: ApiPendingProposalListRow): ApprovalItem => ({
  id: String(row.proposal_id),
  kind: 'Proposal',
  sourceId: String(row.lead_id),
  client: row.company_name,
  title: row.service_name,
  serviceLine: row.service_name,
  submittedBy: row.submitted_by_name ?? '-',
  submittedAt: row.submitted_at ?? new Date().toISOString(),
  detailRoute: `/lead-workspace/${row.lead_id}/proposal`
});

export const approvalProposalsService = {
  async listPending(): Promise<{
    items: ApprovalItem[];
    proposalsById: Record<string, LeadWorkspaceProposalView>;
    companyNamesById: Record<string, string>;
  }> {
    const rows = await getPendingProposalApprovals();
    const items = rows.map(mapPendingProposalToApprovalItem);
    const proposalsById = Object.fromEntries(rows.map((row) => [String(row.proposal_id), mapPendingProposalRow(row)]));
    const companyNamesById = Object.fromEntries(rows.map((row) => [String(row.proposal_id), row.company_name]));
    return { items, proposalsById, companyNamesById };
  },

  async getDetail(proposalId: string): Promise<{
    proposal: LeadWorkspaceProposalView;
    companyName: string;
    leadSummary: ApprovalProposalLeadSummary;
  }> {
    const data = await getPendingProposalApprovalDetail(proposalId);
    return {
      proposal: mapLeadWorkspaceProposalRow(data.proposal),
      companyName: data.proposal.company_name,
      leadSummary: mapLeadSummaryRow(data.lead_summary)
    };
  },

  approve(proposalId: string) {
    return approvePendingProposal(proposalId);
  },

  reject(proposalId: string, note: string) {
    return rejectPendingProposal(proposalId, note);
  }
};
