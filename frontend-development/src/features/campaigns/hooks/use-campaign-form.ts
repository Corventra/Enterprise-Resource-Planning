import { useEffect, useMemo, useState } from 'react';
import type { Campaign, CampaignFormErrors, CampaignPayload } from '../types/campaign.types';
import { channelOptionsByType } from '../utils/campaign-form-options';

const defaultPayload: CampaignPayload = {
  name: '',
  type: 'Acquisition',
  status: 'Draft',
  channel: 'Email',
  topic: '',
  startDate: '',
  endDate: '',
  notes: ''
};

const mapCampaignToPayload = (campaign: Campaign): CampaignPayload => ({
  name: campaign.name,
  type: campaign.type,
  status: campaign.status,
  channel: campaign.channel,
  topic: campaign.topic,
  startDate: campaign.startDate,
  endDate: campaign.endDate,
  notes: campaign.notes || ''
});

interface UseCampaignFormInput {
  initialCampaign?: Campaign;
}

export const useCampaignForm = ({ initialCampaign }: UseCampaignFormInput) => {
  const initialPayload = initialCampaign ? mapCampaignToPayload(initialCampaign) : defaultPayload;
  const [formData, setFormData] = useState<CampaignPayload>(initialPayload);
  const [errors, setErrors] = useState<CampaignFormErrors>({});
  const [noEndDate, setNoEndDate] = useState(Boolean(initialCampaign && !initialCampaign.endDate));

  const availableChannels = useMemo(() => {
    return channelOptionsByType[formData.type];
  }, [formData.type]);

  const setField = <K extends keyof CampaignPayload>(key: K, value: CampaignPayload[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };

      if (key === 'type') {
        const validChannels = channelOptionsByType[value as CampaignPayload['type']];
        if (!validChannels.includes(next.channel)) {
          next.channel = validChannels[0];
        }
      }

      return next;
    });

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
    setFormData(initialPayload);
    setNoEndDate(Boolean(initialCampaign && !initialCampaign.endDate));
    setErrors({});
  };

  useEffect(() => {
    setFormData(initialCampaign ? mapCampaignToPayload(initialCampaign) : defaultPayload);
    setNoEndDate(Boolean(initialCampaign && !initialCampaign.endDate));
    setErrors({});
  }, [initialCampaign]);

  return {
    formData,
    errors,
    noEndDate,
    availableChannels,
    setField,
    setErrors,
    setNoEndDate: setNoEndDateValue,
    resetForm
  };
};
