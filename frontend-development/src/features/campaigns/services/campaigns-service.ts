import { deleteDraftForm, getCampaignForms } from '../../forms/services/forms-api';
import type {
  Campaign,
  CampaignsListMeta,
  CampaignsSummary,
  CampaignsSummaryCreatedByTarget,
  CampaignSnapshotCount,
  CampaignSummaryMetric,
  Form
} from '../types/campaign.types';
import {
  archiveCampaignApi,
  createCampaignApi,
  getCampaignById,
  getCampaignsList,
  updateCampaignApi
} from './campaigns-api';

const mapSnapshotCount = (row: { value: number }): CampaignSnapshotCount => ({
  value: row.value
});

const mapSummaryMetric = (row: {
  value: number;
  previous: number;
  delta: { value: number; direction: 'up' | 'down' | 'flat' };
}): CampaignSummaryMetric => ({
  value: row.value,
  previous: row.previous,
  delta: row.delta
});

const mapMeta = (row: {
  period: string;
  period_start: string;
  period_end_exclusive: string;
  comparison_label: string;
  scope: CampaignsListMeta['scope'];
  summary_created_by?: number;
}): CampaignsListMeta => ({
  period: row.period,
  periodStart: row.period_start,
  periodEndExclusive: row.period_end_exclusive,
  comparisonLabel: row.comparison_label,
  scope: row.scope,
  summaryCreatedByUserId: row.summary_created_by
});

export const campaignsService = {
  async getList(
    period = 'this_month',
    summaryCreatedByTarget: CampaignsSummaryCreatedByTarget = null
  ): Promise<{
    campaigns: Campaign[];
    summary: CampaignsSummary;
    meta: CampaignsListMeta;
  }> {
    const data = await getCampaignsList(period, summaryCreatedByTarget);
    return {
      campaigns: data.campaigns,
      summary: {
        total: mapSnapshotCount(data.summary.total),
        active: mapSnapshotCount(data.summary.active),
        totalSubmissions: mapSummaryMetric(data.summary.total_submissions),
        averagePerCampaign: mapSummaryMetric(data.summary.average_per_campaign)
      },
      meta: mapMeta(data.meta)
    };
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
