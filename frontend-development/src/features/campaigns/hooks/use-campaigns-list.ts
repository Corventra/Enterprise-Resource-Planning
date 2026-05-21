import { useCallback, useEffect, useState } from 'react';
import { campaignsService } from '../services/campaigns-service';
import type {
  Campaign,
  CampaignsListMeta,
  CampaignsSummary,
  CampaignsSummaryCreatedByTarget,
  CampaignSubmitInput,
  CampaignSummaryMetric
} from '../types/campaign.types';

const emptyMetric = (): CampaignSummaryMetric => ({
  value: 0,
  previous: 0,
  delta: { value: 0, direction: 'flat' }
});

const emptySummary: CampaignsSummary = {
  total: { value: 0 },
  active: { value: 0 },
  totalSubmissions: emptyMetric(),
  averagePerCampaign: emptyMetric()
};

export const useCampaignsList = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState<CampaignsSummary>(emptySummary);
  const [meta, setMeta] = useState<CampaignsListMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = useCallback(
    async (options?: {
      silent?: boolean;
      summaryOnly?: boolean;
      summaryCreatedBy?: CampaignsSummaryCreatedByTarget;
    }) => {
      if (!options?.silent && !options?.summaryOnly) {
        setIsLoading(true);
      }
      try {
        const data = await campaignsService.getList(
          'this_month',
          options?.summaryCreatedBy ?? null
        );
        if (!options?.summaryOnly) {
          setCampaigns(data.campaigns);
        }
        setSummary(data.summary);
        setMeta(data.meta);
      } catch {
        if (!options?.summaryOnly) {
          setCampaigns([]);
          setMeta(null);
        }
        setSummary(emptySummary);
      } finally {
        if (!options?.silent && !options?.summaryOnly) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  const refetchSummary = useCallback(
    (summaryCreatedBy: CampaignsSummaryCreatedByTarget) =>
      fetchCampaigns({ silent: true, summaryOnly: true, summaryCreatedBy }),
    [fetchCampaigns]
  );

  useEffect(() => {
    void fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = async (input: CampaignSubmitInput) => {
    const { values, noEndDate, imageFile } = input;
    await campaignsService.create({
      name: values.name,
      campaignTypeId: Number(values.campaignTypeId),
      topicId: Number(values.topicId),
      startDate: values.startDate,
      endDate: noEndDate ? null : values.endDate || null,
      notes: values.notes,
      imageFile
    });
    await fetchCampaigns();
  };

  const updateCampaign = async (campaignId: string, input: CampaignSubmitInput) => {
    const { values, noEndDate, imageFile } = input;
    await campaignsService.update(campaignId, {
      name: values.name,
      campaignTypeId: Number(values.campaignTypeId),
      topicId: Number(values.topicId),
      startDate: values.startDate,
      endDate: noEndDate ? null : values.endDate || null,
      notes: values.notes,
      imageFile
    });
    await fetchCampaigns();
  };

  const archiveCampaign = async (campaignId: string) => {
    await campaignsService.archiveCampaign(campaignId);
    await fetchCampaigns();
  };

  return {
    campaigns,
    isLoading,
    summary,
    meta,
    refetch: fetchCampaigns,
    refetchSummary,
    createCampaign,
    updateCampaign,
    archiveCampaign
  };
};
