import { apiGet, apiPatch, apiPatchFormData, apiPostFormData } from '../../../services/api-client';
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
};

const toYmd = (v: string | null | undefined): string => {
  if (v == null || v === '') return '';
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s.slice(0, 10) : d.toISOString().slice(0, 10);
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
    startDate: toYmd(row.start_date),
    endDate: row.end_date == null || row.end_date === '' ? null : toYmd(row.end_date),
    notes: row.notes,
    imagePath: row.image_path,
    totalSubmissions: 0,
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

export const getCampaigns = async (): Promise<Campaign[]> => {
  const res = await apiGet<{ campaigns: ApiCampaignRow[] }>('/campaigns');
  return (res.campaigns ?? []).map(mapApiRowToCampaign);
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
