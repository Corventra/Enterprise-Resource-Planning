import { useCallback, useEffect, useMemo, useState } from 'react';
import { campaignsService } from '../services/campaigns-service';
import type { Campaign, CampaignSubmitInput } from '../types/campaign.types';

export const useCampaignsList = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await campaignsService.getAll();
      setCampaigns(response);
    } catch {
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const summary = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((campaign) => campaign.status === 'ACTIVE').length;
    const totalSubmissions = campaigns.reduce((acc, campaign) => acc + campaign.totalSubmissions, 0);
    const averagePerCampaign = total === 0 ? 0 : Math.round(totalSubmissions / total);

    return {
      total,
      active,
      totalSubmissions,
      averagePerCampaign
    };
  }, [campaigns]);

  return {
    campaigns,
    isLoading,
    summary,
    refetch: fetchCampaigns,
    createCampaign,
    updateCampaign,
    archiveCampaign
  };
};
