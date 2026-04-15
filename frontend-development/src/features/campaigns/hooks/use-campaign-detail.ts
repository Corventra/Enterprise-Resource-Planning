import { useCallback, useEffect, useState } from 'react';
import { campaignsService } from '../services/campaigns-service';
import type { BankDataEntry, Campaign, Form, Submission } from '../types/campaign.types';

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
    setIsLoading(false);
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

  return {
    ...state,
    isLoading,
    refetch: fetchDetail,
    deleteForm,
    updateForm
  };
};
