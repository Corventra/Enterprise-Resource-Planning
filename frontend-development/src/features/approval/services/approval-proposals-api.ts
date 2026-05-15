import { apiGet, apiPost } from '../../../services/api-client';
import type { ApiLeadWorkspaceProposalRow } from '../../lead-workspace/services/lead-workspace-proposals-api';

export interface ApiPendingProposalListRow {
  approval_id: number;
  proposal_id: number;
  proposal_code: string | null;
  lead_id: number;
  company_name: string;
  service_class_name: string;
  service_name: string;
  issuer_company: 'DSK' | 'DTAX';
  proposal_fee: number;
  discount_amount: number;
  final_fee: number;
  submitted_by_name: string | null;
  submitted_at: string | null;
  proposal_status: 'WAITING_CEO_APPROVAL';
  document: ApiLeadWorkspaceProposalRow['document'];
}

export interface ApiPendingProposalApprovalRow {
  approval_id: number;
  proposal_id: number;
  sequence_no: number;
  decision: 'PENDING';
  note: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface ApiApprovalProposalLeadSummaryRow {
  company_name: string | null;
  pic_name: string | null;
  email: string | null;
  phone_number: string | null;
  lead_source_label: string | null;
  processed_by_name: string | null;
  processed_at: string | null;
  desired_services: string | null;
}

interface ApiPendingProposalListResponse {
  success: boolean;
  data: { items: ApiPendingProposalListRow[] };
}

interface ApiPendingProposalDetailResponse {
  success: boolean;
  data: {
    proposal: ApiLeadWorkspaceProposalRow & { company_name: string };
    approval: ApiPendingProposalApprovalRow;
    lead_summary: ApiApprovalProposalLeadSummaryRow;
  };
}

interface ApiPendingProposalMutationResponse {
  success: boolean;
  data: { proposal: ApiLeadWorkspaceProposalRow & { company_name: string } };
}

export const getPendingProposalApprovals = async (): Promise<ApiPendingProposalListRow[]> => {
  const res = await apiGet<ApiPendingProposalListResponse>('/approvals/proposals/pending');
  return res.data.items;
};

export const getPendingProposalApprovalDetail = async (
  proposalId: string
): Promise<ApiPendingProposalDetailResponse['data']> => {
  const res = await apiGet<ApiPendingProposalDetailResponse>(`/approvals/proposals/${proposalId}`);
  return res.data;
};

export const approvePendingProposal = async (proposalId: string): Promise<void> => {
  await apiPost<ApiPendingProposalMutationResponse>(`/approvals/proposals/${proposalId}/approve`);
};

export const rejectPendingProposal = async (proposalId: string, note: string): Promise<void> => {
  await apiPost<ApiPendingProposalMutationResponse>(`/approvals/proposals/${proposalId}/reject`, { note });
};
