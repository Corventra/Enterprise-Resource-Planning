import { apiGet, apiPost } from '../../../services/api-client';
import type { ApiHandoverDetailPayload } from '../../handover/services/handover-api';
import type { ApiLeadWorkspaceEngagementLeadSummary } from '../../lead-workspace/services/lead-workspace-engagements-api';

export interface ApiPendingHandoverApprovalRow {
  approval_id: number;
  handover_id: number;
  handover_code: string;
  lead_id: number;
  handover_status: string;
  company_name: string | null;
  project_title: string | null;
  service_name: string | null;
  submitted_by_name: string | null;
  submitted_at: string | null;
}

export interface ApiHandoverApprovalRow {
  approval_id: number;
  handover_id: number;
  sequence_no: number;
  decision: string;
  note: string | null;
  decided_at: string | null;
  created_at: string;
}

interface ApiPendingHandoversResponse {
  success: boolean;
  data: { items: ApiPendingHandoverApprovalRow[] };
}

export interface ApiHandoverApprovalDetailData {
  approval: ApiHandoverApprovalRow;
  lead_summary: ApiLeadWorkspaceEngagementLeadSummary | null;
  handover: ApiHandoverDetailPayload;
  ceo_revision_note: string | null;
}

interface ApiHandoverApprovalDetailResponse {
  success: boolean;
  data: ApiHandoverApprovalDetailData;
}

export const getPendingHandoverApprovals = async (): Promise<ApiPendingHandoverApprovalRow[]> => {
  const res = await apiGet<ApiPendingHandoversResponse>('/approvals/handovers/pending');
  return res.data.items;
};

export const getHandoverApprovalDetail = async (handoverId: string): Promise<ApiHandoverApprovalDetailData> => {
  const res = await apiGet<ApiHandoverApprovalDetailResponse>(`/approvals/handovers/${handoverId}`);
  return res.data;
};

interface ApiMutationResponse {
  success: boolean;
  data?: Record<string, unknown>;
}

export const postApproveHandover = async (handoverId: string): Promise<void> => {
  await apiPost<ApiMutationResponse>(`/approvals/handovers/${handoverId}/approve`, {});
};

export const postRejectHandover = async (handoverId: string, note: string): Promise<void> => {
  await apiPost<ApiMutationResponse>(`/approvals/handovers/${handoverId}/reject`, { note });
};
