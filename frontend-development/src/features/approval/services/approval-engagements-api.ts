import { apiGet, apiPost } from '../../../services/api-client';
import type {
  ApiEngagementWorkspaceItem,
  ApiLeadWorkspaceEngagementLeadSummary
} from '../../lead-workspace/services/lead-workspace-engagements-api';

export interface ApiPendingEngagementLetterRow {
  approval_id: number;
  engagement_id: number;
  engagement_code: string | null;
  lead_id: number;
  company_name: string | null;
  issuer_company: 'DSK' | 'DTAX';
  payment_method: 'TERMIN' | 'RETAINER';
  engagement_status: string;
  agreed_fee: number | null;
  submitted_by_name: string | null;
  submitted_at: string | null;
  service_name: string | null;
}

export interface ApiEngagementLetterApprovalRow {
  approval_id: number;
  proposal_id: number | null;
  engagement_id: number | null;
  sequence_no: number;
  decision: string;
  note: string | null;
  decided_at: string | null;
  created_at: string;
}

interface ApiPendingEngagementLettersResponse {
  success: boolean;
  data: { items: ApiPendingEngagementLetterRow[] };
}

interface ApiEngagementLetterApprovalDetailResponse {
  success: boolean;
  data: {
    approval: ApiEngagementLetterApprovalRow;
    lead_summary: ApiLeadWorkspaceEngagementLeadSummary | null;
    item: ApiEngagementWorkspaceItem;
  };
}

export const getPendingEngagementLetterApprovals = async (): Promise<ApiPendingEngagementLetterRow[]> => {
  const res = await apiGet<ApiPendingEngagementLettersResponse>('/approvals/engagement-letters/pending');
  return res.data.items;
};

export const getEngagementLetterApprovalDetail = async (
  engagementId: string
): Promise<ApiEngagementLetterApprovalDetailResponse['data']> => {
  const res = await apiGet<ApiEngagementLetterApprovalDetailResponse>(`/approvals/engagement-letters/${engagementId}`);
  return res.data;
};

interface ApiMutationResponse {
  success: boolean;
  data?: Record<string, unknown>;
}

export const postApproveEngagementLetter = async (engagementId: string): Promise<void> => {
  await apiPost<ApiMutationResponse>(`/approvals/engagement-letters/${engagementId}/approve`, {});
};

export const postRejectEngagementLetter = async (engagementId: string, note: string): Promise<void> => {
  await apiPost<ApiMutationResponse>(`/approvals/engagement-letters/${engagementId}/reject`, { note });
};
