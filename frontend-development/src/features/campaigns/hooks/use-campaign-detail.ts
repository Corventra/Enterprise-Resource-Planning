import { useCallback, useEffect, useState } from 'react';
import { campaignsService } from '../services/campaigns-service';
import { getCampaignSubmissionsCount } from '../../forms/services/form-submissions-api';
import type { Campaign, CampaignSubmitInput, Form } from '../types/campaign.types';

interface CampaignDetailState {
  campaign?: Campaign;
  forms: Form[];
  submissionsCount: number;
}

export const useCampaignDetail = (campaignId?: string) => {
  const [state, setState] = useState<CampaignDetailState>({
    campaign: undefined,
    forms: [],
    submissionsCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!campaignId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [campaign, forms, submissionsCount] = await Promise.all([
        campaignsService.getById(campaignId),
        campaignsService.getFormsByCampaign(campaignId),
        getCampaignSubmissionsCount(campaignId).catch(() => 0)
      ]);

      setState({
        campaign,
        forms,
        submissionsCount
      });
    } catch {
      setState({
        campaign: undefined,
        forms: [],
        submissionsCount: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const deleteForm = async (formId: string) => {
    await campaignsService.deleteForm(formId);
    await fetchDetail();
  };

  const updateForm = async (formId: string, payload: Partial<Form>) => {
    await campaignsService.updateForm(formId, payload);
    await fetchDetail();
  };

  const updateCampaign = async (input: CampaignSubmitInput) => {
    if (!campaignId) return;
    await campaignsService.update(campaignId, {
      name: input.values.name,
      campaignTypeId: Number(input.values.campaignTypeId),
      topicId: Number(input.values.topicId),
      startDate: input.values.startDate,
      endDate: input.noEndDate ? null : input.values.endDate || null,
      notes: input.values.notes,
      imageFile: input.imageFile
    });
    await fetchDetail();
  };

  const archiveCampaign = async () => {
    if (!campaignId) return;
    await campaignsService.archiveCampaign(campaignId);
    await fetchDetail();
  };

  return {
    ...state,
    isLoading,
    refetch: fetchDetail,
    deleteForm,
    updateForm,
    updateCampaign,
    archiveCampaign
  };
};
