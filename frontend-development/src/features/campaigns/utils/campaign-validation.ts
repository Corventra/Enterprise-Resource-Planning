import type { CampaignFormErrors, CampaignPayload } from '../types/campaign.types';

interface ValidateCampaignPayloadInput {
  payload: CampaignPayload;
  noEndDate: boolean;
}

export const validateCampaignPayload = ({
  payload,
  noEndDate
}: ValidateCampaignPayloadInput): CampaignFormErrors => {
  const errors: CampaignFormErrors = {};

  if (!payload.name.trim()) {
    errors.name = 'Campaign name is required.';
  }

  if (!payload.type) {
    errors.type = 'Campaign type is required.';
  }

  if (!payload.channel) {
    errors.channel = 'Channel is required.';
  }

  if (!payload.status) {
    errors.status = 'Status is required.';
  }

  if (!payload.topic.trim()) {
    errors.topic = 'Topic tag is required.';
  }

  if (!payload.startDate) {
    errors.startDate = 'Start date is required.';
  }

  if (!noEndDate && !payload.endDate) {
    errors.endDate = 'End date is required.';
  }

  if (!noEndDate && payload.startDate && payload.endDate && payload.endDate < payload.startDate) {
    errors.endDate = 'End date cannot be before start date.';
  }

  return errors;
};
