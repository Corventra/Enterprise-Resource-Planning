import type { CampaignStatus, CampaignType, Channel } from '../types/campaign.types';

export const campaignTypeOptions: CampaignType[] = ['Acquisition', 'Retention', 'Awareness'];

export const campaignStatusOptions: CampaignStatus[] = ['Draft', 'Active', 'Paused', 'Completed'];

export const channelOptionsByType: Record<CampaignType, Channel[]> = {
  Acquisition: ['LinkedIn', 'Website', 'WhatsApp', 'Email'],
  Retention: ['Email', 'WhatsApp', 'Website'],
  Awareness: ['Instagram', 'LinkedIn', 'Website']
};
