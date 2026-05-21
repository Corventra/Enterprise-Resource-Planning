import { apiGet, apiPatch, apiPatchFormData, apiPostFormData } from '../../../services/api-client';
import { normalizeDateOnlyString } from '../../../utils/format-date-only';
import type {
  Campaign,
  CampaignApiStatus,
  CampaignLookupTopic,
  CampaignLookupType
} from '../types/campaign.types';

type ApiCampaignRow = {
  campaign_id: number;
  campaign_code: string | null;
  name: string;
  status: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
  campaign_type_id: number;
  campaign_type_name: string;
  campaign_type_code: string;
  topic_id: number;
  topic_name: string;
  topic_code: string;
  created_by: number;
  created_by_name: string;
  total_submissions?: number;
};

export const mapApiRowToCampaign = (row: ApiCampaignRow): Campaign => {
  const status: CampaignApiStatus = row.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE';
  return {
    id: String(row.campaign_id),
    campaignCode: String(row.campaign_code ?? ''),
    name: row.name,
    createdBy: row.created_by_name ?? '',
    createdById: Number(row.created_by),
    campaignTypeId: row.campaign_type_id,
    campaignTypeName: row.campaign_type_name,
    campaignTypeCode: row.campaign_type_code,
    topicId: row.topic_id,
    topicName: row.topic_name,
    topicCode: row.topic_code,
    status,
    startDate: normalizeDateOnlyString(row.start_date) ?? '',
    endDate: normalizeDateOnlyString(row.end_date),
    notes: row.notes,
    imagePath: row.image_path,
    totalSubmissions: Number(row.total_submissions ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const getCampaignTypes = async (): Promise<CampaignLookupType[]> => {
  const res = await apiGet<{ campaign_types: CampaignLookupType[] }>('/campaigns/types');
  return res.campaign_types ?? [];
};

export const getCampaignTopics = async (): Promise<CampaignLookupTopic[]> => {
  const res = await apiGet<{ topics: CampaignLookupTopic[] }>('/campaigns/topics');
  return res.topics ?? [];
};

interface ApiCampaignSummaryMetric {
  value: number;
  previous: number;
  delta: { value: number; direction: 'up' | 'down' | 'flat' };
}

interface ApiCampaignSnapshotCount {
  value: number;
}

interface ApiCampaignsSummary {
  total: ApiCampaignSnapshotCount;
  active: ApiCampaignSnapshotCount;
  total_submissions: ApiCampaignSummaryMetric;
  average_per_campaign: ApiCampaignSummaryMetric;
}

interface ApiCampaignsListMeta {
  period: string;
  period_start: string;
  period_end_exclusive: string;
  comparison_label: string;
  scope: 'own_marketing' | 'organization' | 'filtered_user';
  summary_created_by?: number;
}

export interface CampaignsListPayload {
  campaigns: Campaign[];
  summary: ApiCampaignsSummary;
  meta: ApiCampaignsListMeta;
}

export const getCampaignsList = async (
  period = 'this_month',
  summaryCreatedByUserId: number | null = null
): Promise<CampaignsListPayload> => {
  const params = new URLSearchParams({ period });
  if (summaryCreatedByUserId != null) {
    params.set('summary_created_by', String(summaryCreatedByUserId));
  }
  const res = await apiGet<{
    campaigns: ApiCampaignRow[];
    summary: ApiCampaignsSummary;
    meta: ApiCampaignsListMeta;
  }>(`/campaigns?${params.toString()}`);

  return {
    campaigns: (res.campaigns ?? []).map(mapApiRowToCampaign),
    summary: res.summary,
    meta: res.meta
  };
};

export const getCampaignById = async (id: string): Promise<Campaign | null> => {
  const res = await apiGet<{ campaign: ApiCampaignRow }>(`/campaigns/${encodeURIComponent(id)}`);
  if (!res?.campaign) return null;
  return mapApiRowToCampaign(res.campaign);
};

export const buildCampaignFormData = (params: {
  name: string;
  campaignTypeId: number;
  topicId: number;
  startDate: string;
  endDate?: string | null;
  notes: string;
  imageFile?: File | null;
}): FormData => {
  const fd = new FormData();
  fd.append('campaign_type_id', String(params.campaignTypeId));
  fd.append('topic_id', String(params.topicId));
  fd.append('name', params.name.trim());
  fd.append('start_date', params.startDate);
  if (params.endDate != null && params.endDate !== '') {
    fd.append('end_date', params.endDate);
  }
  fd.append('notes', params.notes.trim());
  if (params.imageFile) {
    fd.append('image', params.imageFile);
  }
  return fd;
};

export const createCampaignApi = async (input: {
  name: string;
  campaignTypeId: number;
  topicId: number;
  startDate: string;
  endDate: string | null;
  notes: string;
  imageFile: File | null;
}): Promise<Campaign> => {
  const fd = buildCampaignFormData({
    name: input.name,
    campaignTypeId: input.campaignTypeId,
    topicId: input.topicId,
    startDate: input.startDate,
    endDate: input.endDate,
    notes: input.notes,
    imageFile: input.imageFile
  });
  const res = await apiPostFormData<{ campaign: ApiCampaignRow }>('/campaigns', fd);
  return mapApiRowToCampaign(res.campaign);
};

export const updateCampaignApi = async (
  id: string,
  input: {
    name: string;
    campaignTypeId: number;
    topicId: number;
    startDate: string;
    endDate: string | null;
    notes: string;
    imageFile: File | null;
  }
): Promise<Campaign> => {
  const fd = buildCampaignFormData({
    name: input.name,
    campaignTypeId: input.campaignTypeId,
    topicId: input.topicId,
    startDate: input.startDate,
    endDate: input.endDate,
    notes: input.notes,
    imageFile: input.imageFile
  });
  const res = await apiPatchFormData<{ campaign: ApiCampaignRow }>(
    `/campaigns/${encodeURIComponent(id)}`,
    fd
  );
  return mapApiRowToCampaign(res.campaign);
};

export const archiveCampaignApi = async (id: string): Promise<void> => {
  await apiPatch(`/campaigns/${encodeURIComponent(id)}/archive`, {});
};
