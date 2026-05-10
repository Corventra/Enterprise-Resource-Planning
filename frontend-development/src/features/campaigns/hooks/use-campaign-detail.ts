import { useCallback, useEffect, useState } from 'react';
import { campaignsService } from '../services/campaigns-service';
import type { BankDataEntry, Campaign, CampaignSubmitInput, Form, Submission } from '../types/campaign.types';

interface CampaignDetailState {
  campaign?: Campaign;
  forms: Form[];
  submissions: Submission[];
  bankDataEntries: BankDataEntry[];
}

export const useCampaignDetail = (campaignId?: string) => {
  const [state, setState] = useState<CampaignDetailState>({
    campaign: undefined,
    forms: [],
    submissions: [],
    bankDataEntries: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!campaignId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [campaign, forms, submissions, bankDataEntries] = await Promise.all([
        campaignsService.getById(campaignId),
        campaignsService.getFormsByCampaign(campaignId),
        campaignsService.getSubmissionsByCampaign(campaignId),
        campaignsService.getBankDataEntries(campaignId)
      ]);

      setState({
        campaign,
        forms,
        submissions,
        bankDataEntries
      });
    } catch {
      setState({
        campaign: undefined,
        forms: [],
        submissions: [],
        bankDataEntries: []
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
