import { apiGet, apiPost } from '../../../services/api-client';

export interface ApiLeadTrackerListRow {
  lead_id: number;
  lead_code: string | null;
  company_name: string;
  pic_name: string;
  email: string;
  phone_number: string;
  current_stage: 'MEETING' | 'MINUTES' | 'PROPOSAL' | 'ENGAGEMENT_LETTER';
  stage_progress: string;
  next_action: string | null;
  due_date: string | null;
  lead_status: 'ACTIVE' | 'WON' | 'LOST';
  processed_by: number | null;
  processed_by_name: string | null;
  processed_at: string | null;
}

interface ApiLeadTrackerSummaryMetric {
  value: number;
  previous: number;
  delta: { value: number; direction: 'up' | 'down' | 'flat' };
}

interface ApiLeadTrackerSnapshotCount {
  value: number;
}

interface ApiLeadTrackerSummary {
  total_leads: ApiLeadTrackerSummaryMetric;
  active_leads: ApiLeadTrackerSnapshotCount;
  won_leads: ApiLeadTrackerSummaryMetric;
  lost_leads: ApiLeadTrackerSummaryMetric;
}

interface ApiLeadTrackerListMeta {
  period: string;
  period_start: string;
  period_end_exclusive: string;
  comparison_label: string;
  scope: 'own_leads' | 'organization' | 'filtered_user' | 'filtered_unassigned';
  summary_processed_by?: number;
}

interface ApiListResponse {
  success: boolean;
  data: {
    entries: ApiLeadTrackerListRow[];
    summary: ApiLeadTrackerSummary;
    meta: ApiLeadTrackerListMeta;
  };
}

export interface LeadTrackerListPayload {
  entries: ApiLeadTrackerListRow[];
  summary: ApiLeadTrackerSummary;
  meta: ApiLeadTrackerListMeta;
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

export type LeadTrackerSummaryQuery =
  | { processedByUserId: number }
  | { unassigned: true }
  | null;

export const getLeadTrackerList = async (
  period = 'this_month',
  summaryQuery: LeadTrackerSummaryQuery = null
): Promise<LeadTrackerListPayload> => {
  const params = new URLSearchParams({ period });
  if (summaryQuery != null) {
    if ('unassigned' in summaryQuery && summaryQuery.unassigned) {
      params.set('summary_unassigned', '1');
    } else if ('processedByUserId' in summaryQuery) {
      params.set('summary_processed_by', String(summaryQuery.processedByUserId));
    }
  }
  const res = await apiGet<ApiListResponse>(`/lead-tracker?${params.toString()}`);
  return res.data;
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
