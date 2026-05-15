import { apiGet, apiPatch } from '../../../services/api-client';
import type { LeadActivityType } from '../types/lead-activity.types';

export interface ApiLeadWorkspaceActivityLogRow {
  activity_id: number;
  activity_type: LeadActivityType;
  title: string;
  description: string | null;
  created_at: string;
  created_by: number | null;
  created_by_name: string | null;
}

export interface ApiLeadWorkspaceDetailRow {
  lead_id: number;
  lead_code: string | null;
  company_name: string;
  company_address: string;
  pic_name: string;
  email: string;
  phone_number: string;
  desired_services: string | null;
  source_type: 'FORM_LEAD_CAPTURE' | 'MANUAL';
  bank_data_status: 'NEW' | 'PROCESSED' | 'ARCHIVED' | null;
  lead_status: 'ACTIVE' | 'WON' | 'LOST';
  current_stage: 'MEETING' | 'MINUTES' | 'PROPOSAL' | 'ENGAGEMENT_LETTER' | null;
  stage_progress: string | null;
  next_action: string | null;
  due_date: string | null;
  processed_at: string | null;
  processed_by: number | null;
  processed_by_name: string | null;
  updated_at: string | null;
  campaign_id: number | null;
  campaign_name: string | null;
  form_id: number | null;
  form_title: string | null;
  distribution_link_id: number | null;
  lead_source_label: string;
  activity_logs: ApiLeadWorkspaceActivityLogRow[];
}

interface ApiDetailResponse {
  success: boolean;
  data: { entry: ApiLeadWorkspaceDetailRow };
}

interface ApiMutationResponse {
  success: boolean;
  message?: string;
  data: { entry: ApiLeadWorkspaceDetailRow };
}

export interface ApiUpdateLeadWorkspaceDetailsBody {
  company_name: string;
  company_address: string;
  pic_name: string;
  email: string;
  phone_number: string;
  desired_services?: string | null;
}

export const getLeadWorkspaceDetail = async (leadId: string): Promise<ApiLeadWorkspaceDetailRow> => {
  const res = await apiGet<ApiDetailResponse>(`/lead-workspace/${leadId}`);
  return res.data.entry;
};

export const patchLeadWorkspaceDetails = async (
  leadId: string,
  body: ApiUpdateLeadWorkspaceDetailsBody
): Promise<ApiLeadWorkspaceDetailRow> => {
  const res = await apiPatch<ApiMutationResponse>(`/lead-workspace/${leadId}/details`, body);
  return res.data.entry;
};
