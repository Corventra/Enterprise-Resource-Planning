import { apiGet, apiPost } from '../../../services/api-client';

export interface ApiBankDataListRow {
  lead_id: number;
  submitted_at: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  source_label: string;
  campaign_name: string | null;
  form_title: string | null;
  bank_data_status: 'NEW' | 'PROCESSED' | 'ARCHIVED';
  handled_by_user_id: number | null;
  handled_by_name: string | null;
  handled_at: string | null;
}

export interface ApiBankDataExtraAnswerRow {
  field_id: number;
  field_key: string;
  label: string;
  field_type: string;
  sort_order: number;
  answer_value: string | null;
  answer_display_value: string | null;
  answer_file_path: string | null;
}

export interface ApiBankDataDetailRow extends ApiBankDataListRow {
  company_address: string | null;
  desired_services: string | null;
  extra_answers: ApiBankDataExtraAnswerRow[];
}

interface ApiListResponse {
  success: boolean;
  data: { entries: ApiBankDataListRow[] };
}

interface ApiDetailResponse {
  success: boolean;
  data: { entry: ApiBankDataDetailRow };
}

interface ApiMutationResponse {
  success: boolean;
  message?: string;
  data: { entry: ApiBankDataDetailRow };
}

export const getBankDataEntries = async (): Promise<ApiBankDataListRow[]> => {
  const res = await apiGet<ApiListResponse>('/bank-data');
  return res.data.entries;
};

export const getBankDataEntryById = async (leadId: string): Promise<ApiBankDataDetailRow> => {
  const res = await apiGet<ApiDetailResponse>(`/bank-data/${leadId}`);
  return res.data.entry;
};

export const processBankDataEntry = async (leadId: string): Promise<ApiBankDataDetailRow> => {
  const res = await apiPost<ApiMutationResponse>(`/bank-data/${leadId}/process`);
  return res.data.entry;
};

export const archiveBankDataEntry = async (leadId: string): Promise<ApiBankDataDetailRow> => {
  const res = await apiPost<ApiMutationResponse>(`/bank-data/${leadId}/archive`);
  return res.data.entry;
};
