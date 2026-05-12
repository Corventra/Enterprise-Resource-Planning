import { apiGet, apiPost } from '../../../services/api-client';

export interface ApiLeadTrackerListRow {
  lead_id: number;
  company_name: string;
  pic_name: string;
  email: string;
  phone_number: string;
  current_stage: 'MEETING' | 'MINUTES' | 'PROPOSAL' | 'ENGAGEMENT_LETTER';
  stage_progress: string;
  next_action: string | null;
  due_date: string | null;
  lead_status: 'ACTIVE' | 'WON' | 'LOST';
  processed_by_name: string | null;
  processed_at: string | null;
}

interface ApiListResponse {
  success: boolean;
  data: { entries: ApiLeadTrackerListRow[] };
}

interface ApiMutationResponse {
  success: boolean;
  message?: string;
  data: { entry: ApiLeadTrackerListRow };
}

export interface ApiCreateManualLeadBody {
  company_name: string;
  company_address: string;
  pic_name: string;
  email: string;
  phone_number: string;
  desired_services?: string | null;
}

export interface ApiMarkLeadLostBody {
  lost_reason_code: string;
  lost_reason_note?: string | null;
}

export const getLeadTrackerEntries = async (): Promise<ApiLeadTrackerListRow[]> => {
  const res = await apiGet<ApiListResponse>('/lead-tracker');
  return res.data.entries;
};

export const createManualLeadEntry = async (body: ApiCreateManualLeadBody): Promise<ApiLeadTrackerListRow> => {
  const res = await apiPost<ApiMutationResponse>('/lead-tracker/manual', body);
  return res.data.entry;
};

export const markLeadLostEntry = async (
  leadId: string,
  body: ApiMarkLeadLostBody
): Promise<ApiLeadTrackerListRow> => {
  const res = await apiPost<ApiMutationResponse>(`/lead-tracker/${leadId}/mark-lost`, body);
  return res.data.entry;
};
