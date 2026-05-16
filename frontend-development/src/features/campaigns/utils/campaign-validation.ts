import type { CampaignFormErrors, CampaignFormValues } from '../types/campaign.types';

interface ValidateCampaignFormInput {
  values: CampaignFormValues;
  noEndDate: boolean;
}

export const validateCampaignFormValues = ({ values, noEndDate }: ValidateCampaignFormInput): CampaignFormErrors => {
  const errors: CampaignFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Campaign name is required.';
  }

  if (values.campaignTypeId === '' || !Number.isFinite(Number(values.campaignTypeId))) {
    errors.campaignTypeId = 'Campaign type is required.';
  }

  if (values.topicId === '' || !Number.isFinite(Number(values.topicId))) {
    errors.topicId = 'Topic is required.';
  }

  if (!values.startDate) {
    errors.startDate = 'Start date is required.';
  }

  if (!noEndDate && !values.endDate) {
    errors.endDate = 'End date is required.';
  }

  if (!noEndDate && values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = 'End date cannot be before start date.';
  }

  return errors;
};
