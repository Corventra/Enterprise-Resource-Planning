import type { Channel } from '../types/campaign.types';

const channelLabelMap: Record<Channel, string> = {
  Email: 'Email',
  WhatsApp: 'WhatsApp',
  Instagram: 'Instagram',
  LinkedIn: 'LinkedIn',
  Website: 'Website'
};

export const formatChannel = (channel: Channel): string => channelLabelMap[channel];
