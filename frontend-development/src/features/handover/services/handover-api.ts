import { apiGet, apiPatchFormData, apiPost } from '../../../services/api-client';

export interface ApiHandoverListRow {
  handover_id: number;
  handover_code: string;
  company_name: string | null;
  project_title: string | null;
  service_name: string | null;
  project_start_date: string | null;
  project_end_date: string | null;
  engagement_status: string | null;
  engagement_signed_at: string | null;
  handover_status: string;
  created_by_name: string | null;
  created_at: string | null;
}

export interface ApiHandoverMilestoneRow {
  milestone_id: number;
  milestone_name: string;
  target_date: string | null;
  notes: string | null;
  sort_order: number;
}

export interface ApiHandoverFeeItem {
  term_name: string;
  amount: number | null;
  description: string | null;
  term_type?: string;
  percentage?: number | null;
}

export interface ApiHandoverClientDocument {
  document_id: number;
  document_name: string;
  file_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  created_at: string | null;
}

export interface ApiHandoverExternalProtocol {
  role: string;
  name: string;
  contact: string;
  instruction: string | null;
}

export interface ApiHandoverChecklistRow {
  checklist_id: number;
  item_code: string;
  item_name: string;
  item_group: string;
  status: 'NO' | 'PENDING' | 'PARTIAL' | 'YES';
  completed_at: string | null;
  sort_order: number;
}

export interface ApiHandoverActivityLogRow {
  activity_id: number;
  activity_type: string;
  title: string;
  description: string | null;
  created_by_name: string | null;
  created_at: string | null;
}

export interface ApiHandoverDetailPayload {
  handover_id: number;
  handover_code: string;
  lead_id: number;
  processed_by: number | null;
  status: string;
  ceo_revision_note: string | null;
  created_at: string | null;
  updated_at: string | null;
  project_information: {
    project_title: string | null;
    client_name: string | null;
    company_group: string | null;
    service_line: string | null;
    project_start_date: string | null;
    project_end_date: string | null;
    project_period: string | null;
    pic_client_name: string | null;
    client_contact: string | null;
    engagement_status: string | null;
    engagement_signed_at: string | null;
    proposal_reference: string | null;
    engagement_reference: string | null;
    created_by_name: string | null;
  };
  background_summary: string | null;
  scope: {
    scope_included: string[];
    scope_excluded: string[];
    deliverables: string[];
    milestones: ApiHandoverMilestoneRow[];
  };
  fee_structure: {
    payment_method: 'TERMIN' | 'RETAINER';
    fee_items: ApiHandoverFeeItem[];
    retainer_summary?: {
      contract_start_date: string | null;
      contract_end_date: string | null;
      billing_timing: string;
      month_count: number;
      monthly_amount_estimate: number | null;
    };
  };
  client_documents: ApiHandoverClientDocument[];
  outstanding_requirements: Array<{ outstanding_id: number; requirement_text: string }>;
  risks: {
    risk_items: string[];
    risk_internal_note: string | null;
  };
  communication_protocol: {
    internal_items: string[];
    external_items: ApiHandoverExternalProtocol[];
  };
  team_requirements: Array<{
    requirement_id: number;
    role_name: string;
    needed: string;
    responsibilities: string;
    notes: string | null;
  }>;
  checklist: ApiHandoverChecklistRow[];
  activity_logs: ApiHandoverActivityLogRow[];
}

interface ApiHandoverListResponse {
  success: boolean;
  data: { items: ApiHandoverListRow[] };
}

interface ApiHandoverDetailResponse {
  success: boolean;
  data: ApiHandoverDetailPayload;
}

export const getHandovers = async (): Promise<ApiHandoverListRow[]> => {
  const res = await apiGet<ApiHandoverListResponse>('/handovers');
  return res.data.items;
};

export const getHandoverById = async (handoverId: string): Promise<ApiHandoverDetailPayload> => {
  const res = await apiGet<ApiHandoverDetailResponse>(`/handovers/${handoverId}`);
  return res.data;
};

interface ApiHandoverMutationResponse {
  success: boolean;
  data: ApiHandoverDetailPayload;
}

export const patchHandoverDraft = async (handoverId: string, formData: FormData): Promise<ApiHandoverDetailPayload> => {
  const res = await apiPatchFormData<ApiHandoverMutationResponse>(`/handovers/${handoverId}`, formData);
  return res.data;
};

export const submitHandover = async (handoverId: string): Promise<ApiHandoverDetailPayload> => {
  const res = await apiPost<ApiHandoverMutationResponse>(`/handovers/${handoverId}/submit`);
  return res.data;
};
