import type { CampaignStatus, CampaignType, Channel } from '../types/campaign.types';

type BadgeCategory = 'status' | 'type' | 'channel';

export const getCampaignBadgeColor = (
  category: BadgeCategory,
  value: CampaignStatus | CampaignType | Channel
): string => {
  const statusMap: Record<CampaignStatus, string> = {
    Draft: 'bg-slate-100 text-slate-700 border-slate-200',
    Active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Paused: 'bg-amber-100 text-amber-700 border-amber-200',
    Completed: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  const typeMap: Record<CampaignType, string> = {
    Acquisition: 'bg-violet-100 text-violet-700 border-violet-200',
    Retention: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    Awareness: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200'
  };

  const channelMap: Record<Channel, string> = {
    Email: 'bg-sky-100 text-sky-700 border-sky-200',
    WhatsApp: 'bg-green-100 text-green-700 border-green-200',
    Instagram: 'bg-pink-100 text-pink-700 border-pink-200',
    LinkedIn: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    Website: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  if (category === 'status') {
    return statusMap[value as CampaignStatus];
  }

  if (category === 'type') {
    return typeMap[value as CampaignType];
  }

  return channelMap[value as Channel];
};
