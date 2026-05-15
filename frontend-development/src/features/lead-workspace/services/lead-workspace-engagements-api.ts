import { apiDelete, apiGet, apiPatchFormData, apiPost, apiPostFormData } from '../../../services/api-client';

/** Ringkasan lead (snake_case) — konsisten dengan approval proposal. */
export interface ApiLeadWorkspaceEngagementLeadSummary {
  company_name: string | null;
  pic_name: string | null;
  email: string | null;
  phone_number: string | null;
  desired_services: string | null;
  lead_source_label: string | null;
  processed_by_name: string | null;
  processed_at: string | null;
}

export interface ApiEngagementLetterWorkspaceEngagement {
  engagement_id: number;
  lead_id: number;
  proposal_id: number;
  issuer_company: 'DSK' | 'DTAX';
  agreed_fee: number | null;
  payment_method: 'TERMIN' | 'RETAINER';
  engagement_status: string;
  revision_note: string | null;
  created_by: number;
  created_by_name: string | null;
  created_at: string;
  submitted_by: number | null;
  submitted_by_name: string | null;
  submitted_at: string | null;
  approved_by: number | null;
  approved_by_name: string | null;
  approved_at: string | null;
  sent_to_client_at: string | null;
  signed_at: string | null;
  updated_at: string;
}

export interface ApiEngagementLetterWorkspaceProposalSummary {
  proposal_id: number;
  service_class_name: string | null;
  service_name: string | null;
  proposal_fee: number;
  discount_amount: number;
  final_proposal_value: number;
  proposal_status: string;
  proposal_issuer_company: string | null;
  latest_proposal_document_name: string | null;
  latest_proposal_document_path: string | null;
  latest_proposal_document_version: number | null;
  latest_proposal_document_uploaded_at: string | null;
}

export interface ApiEngagementLetterTerminRow {
  termin_id: number;
  engagement_id: number;
  term_name: string;
  term_type: 'DOWN_PAYMENT' | 'INSTALLMENT' | 'FINAL';
  percentage: number | null;
  description: string | null;
  billing_schedule_date: string | null;
  sort_order: number;
}

export interface ApiEngagementLetterRetainerRow {
  retainer_id: number;
  engagement_id: number;
  contract_start_date: string | null;
  contract_end_date: string | null;
  billing_timing: 'BEGINNING_OF_MONTH' | 'END_OF_MONTH';
}

export interface ApiLatestEngagementDocumentPayload {
  latest_document_name: string;
  latest_document_path: string;
  latest_document_version: number;
  latest_document_uploaded_at: string;
  latest_document_size_bytes: number | null;
  latest_document_mime_type: string | null;
}

export interface ApiEngagementWorkspaceItem {
  engagement: ApiEngagementLetterWorkspaceEngagement;
  proposal_summary: ApiEngagementLetterWorkspaceProposalSummary;
  termins: ApiEngagementLetterTerminRow[];
  retainer: ApiEngagementLetterRetainerRow | null;
  latest_engagement_document: ApiLatestEngagementDocumentPayload | null;
}

export interface ApiEngagementLetterWorkspaceData {
  lead_summary: ApiLeadWorkspaceEngagementLeadSummary | null;
  items: ApiEngagementWorkspaceItem[];
  proposal_without_engagement: ApiEngagementLetterWorkspaceProposalSummary | null;
}

interface ApiEngagementLetterWorkspaceResponse {
  success: boolean;
  data: ApiEngagementLetterWorkspaceData;
}

export const getLeadWorkspaceEngagementLetterBundle = async (leadId: string): Promise<ApiEngagementLetterWorkspaceData> => {
  const res = await apiGet<ApiEngagementLetterWorkspaceResponse>(`/lead-workspace/${leadId}/engagement-letter`);
  return res.data;
};

interface ApiEngagementLetterMutationResponse {
  success: boolean;
  data: { item: ApiEngagementWorkspaceItem };
}

interface ApiEngagementLetterDeleteResponse {
  success: boolean;
  data: Record<string, never>;
}

export const postLeadWorkspaceEngagementLetter = async (
  leadId: string,
  formData: FormData
): Promise<ApiEngagementWorkspaceItem> => {
  const res = await apiPostFormData<ApiEngagementLetterMutationResponse>(`/lead-workspace/${leadId}/engagement-letter`, formData);
  return res.data.item;
};

export const patchLeadWorkspaceEngagementLetter = async (
  leadId: string,
  engagementId: string,
  formData: FormData
): Promise<ApiEngagementWorkspaceItem> => {
  const res = await apiPatchFormData<ApiEngagementLetterMutationResponse>(
    `/lead-workspace/${leadId}/engagement-letter/${engagementId}`,
    formData
  );
  return res.data.item;
};

export const deleteLeadWorkspaceEngagementLetter = async (leadId: string, engagementId: string): Promise<void> => {
  await apiDelete<ApiEngagementLetterDeleteResponse>(`/lead-workspace/${leadId}/engagement-letter/${engagementId}`);
};

export const submitLeadWorkspaceEngagementLetter = async (leadId: string, engagementId: string): Promise<ApiEngagementWorkspaceItem> => {
  const res = await apiPost<ApiEngagementLetterMutationResponse>(
    `/lead-workspace/${leadId}/engagement-letter/${engagementId}/submit`
  );
  return res.data.item;
};

export const postLeadWorkspaceEngagementLetterSent = async (
  leadId: string,
  engagementId: string
): Promise<ApiEngagementWorkspaceItem> => {
  const res = await apiPost<ApiEngagementLetterMutationResponse>(
    `/lead-workspace/${leadId}/engagement-letter/${engagementId}/sent`
  );
  return res.data.item;
};

interface ApiEngagementLetterSignedResponse {
  success: boolean;
  data: {
    item: ApiEngagementWorkspaceItem;
    provisioning?: {
      handover_id: number;
      handover_code: string;
      account_id: number;
      invoice_term_count: number;
    } | null;
  };
}

export const postLeadWorkspaceEngagementLetterSigned = async (
  leadId: string,
  engagementId: string
): Promise<ApiEngagementLetterSignedResponse['data']> => {
  const res = await apiPost<ApiEngagementLetterSignedResponse>(
    `/lead-workspace/${leadId}/engagement-letter/${engagementId}/signed`
  );
  return res.data;
};
