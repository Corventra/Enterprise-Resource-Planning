import { useCallback, useEffect, useMemo, useState } from 'react';
import { campaignsService } from '../services/campaigns-service';
import type { Campaign, CampaignPayload } from '../types/campaign.types';

export const useCampaignsList = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    const response = await campaignsService.getAll();
    setCampaigns(response);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = async (payload: CampaignPayload) => {
    await campaignsService.create(payload);
    await fetchCampaigns();
  };

  const updateCampaign = async (campaignId: string, payload: CampaignPayload) => {
    await campaignsService.update(campaignId, payload);
    await fetchCampaigns();
  };

  const deleteCampaign = async (campaignId: string) => {
    await campaignsService.delete(campaignId);
    await fetchCampaigns();
  };

  const summary = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((campaign) => campaign.status === 'Active').length;
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
    deleteCampaign
  };
};
