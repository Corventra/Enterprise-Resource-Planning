import { deleteDraftForm, getCampaignForms } from '../../forms/services/forms-api';
import type { Campaign, Form } from '../types/campaign.types';
import {
  archiveCampaignApi,
  createCampaignApi,
  getCampaignById,
  getCampaigns,
  updateCampaignApi
} from './campaigns-api';

export const campaignsService = {
  async getAll(): Promise<Campaign[]> {
    return getCampaigns();
  },

  async getById(campaignId: string): Promise<Campaign | undefined> {
    const c = await getCampaignById(campaignId);
    return c ?? undefined;
  },

  async create(input: {
    name: string;
    campaignTypeId: number;
    topicId: number;
    startDate: string;
    endDate: string | null;
    notes: string;
    imageFile: File | null;
  }): Promise<Campaign> {
    return createCampaignApi(input);
  },

  async update(
    campaignId: string,
    input: {
      name: string;
      campaignTypeId: number;
      topicId: number;
      startDate: string;
      endDate: string | null;
      notes: string;
      imageFile: File | null;
    }
  ): Promise<Campaign> {
    return updateCampaignApi(campaignId, input);
  },

  async archiveCampaign(campaignId: string): Promise<void> {
    await archiveCampaignApi(campaignId);
  },

  async getFormsByCampaign(campaignId: string): Promise<Form[]> {
    const rows = await getCampaignForms(campaignId);
    return rows.map((r) => ({
      id: String(r.form_id),
      campaignId: String(r.campaign_id),
      name: r.title,
      status:
        r.status === 'PUBLISHED'
          ? 'Active'
          : r.status === 'INACTIVE'
            ? 'Inactive'
            : ('Draft' as const),
      publishedAt: r.published_at ?? '',
      formCode: r.form_code ?? undefined,
      submissionCount: 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      createdBy: String(r.created_by),
      backendFormStatus: r.status,
      isAcceptingResponses: r.is_accepting_responses,
      formCategory: r.form_category
    }));
  },

  /** Phase A: tidak ada endpoint ubah status form di backend — noop untuk kompat hook lama. */
  async updateForm(_formId: string, _payload: Partial<Form>): Promise<Form> {
    throw new Error('Update form status belum tersedia pada Phase A.');
  },

  async deleteForm(formId: string): Promise<void> {
    await deleteDraftForm(formId);
  }
};
