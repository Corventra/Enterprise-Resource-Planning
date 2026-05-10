import { useState } from 'react';
import type { Campaign, CampaignFormErrors, CampaignFormValues } from '../types/campaign.types';

const defaultValues: CampaignFormValues = {
  name: '',
  campaignTypeId: '',
  topicId: '',
  startDate: '',
  endDate: '',
  notes: ''
};

const mapCampaignToFormValues = (campaign: Campaign): CampaignFormValues => ({
  name: campaign.name,
  campaignTypeId: campaign.campaignTypeId,
  topicId: campaign.topicId,
  startDate: campaign.startDate,
  endDate: campaign.endDate ?? '',
  notes: campaign.notes?.trim() ?? ''
});

interface UseCampaignFormInput {
  initialCampaign?: Campaign;
}

export const useCampaignForm = ({ initialCampaign }: UseCampaignFormInput) => {
  const [formData, setFormData] = useState<CampaignFormValues>(() =>
    initialCampaign ? mapCampaignToFormValues(initialCampaign) : defaultValues
  );
  const [errors, setErrors] = useState<CampaignFormErrors>({});
  const [noEndDate, setNoEndDate] = useState(Boolean(initialCampaign && !initialCampaign.endDate));

  const setField = <K extends keyof CampaignFormValues>(key: K, value: CampaignFormValues[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const setNoEndDateValue = (value: boolean) => {
    setNoEndDate(value);
    if (value) {
      setField('endDate', '');
      setErrors((prev) => ({ ...prev, endDate: undefined }));
    }
  };

  const resetForm = () => {
    setFormData(initialCampaign ? mapCampaignToFormValues(initialCampaign) : defaultValues);
    setNoEndDate(Boolean(initialCampaign && !initialCampaign.endDate));
    setErrors({});
  };

  return {
    formData,
    errors,
    noEndDate,
    setField,
    setErrors,
    setNoEndDate: setNoEndDateValue,
    resetForm
  };
};
