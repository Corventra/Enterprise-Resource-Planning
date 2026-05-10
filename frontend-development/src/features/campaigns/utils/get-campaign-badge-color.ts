type BadgeCategory = 'status' | 'type' | 'channel';

export const getCampaignBadgeColor = (category: BadgeCategory, value: string): string => {
  const statusMap: Record<string, string> = {
    Draft: 'bg-[#d9e2ff] text-[#00419c] border-[#b0c6ff]',
    Active: 'bg-[#4edea3]/25 text-[#004b31] border-[#4edea3]/40',
    Paused: 'bg-[#e0e3e5] text-[#434653] border-[#c3c6d5]',
    Completed: 'bg-[#e0e3e5] text-[#434653] border-[#c3c6d5]',
    ACTIVE: 'bg-[#4edea3]/25 text-[#004b31] border-[#4edea3]/40',
    ARCHIVED: 'bg-[#e0e3e5] text-[#434653] border-[#c3c6d5]'
  };

  const typeMap: Record<string, string> = {
    Acquisition: 'bg-violet-100 text-violet-700 border-violet-200',
    Retention: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    Awareness: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200'
  };

  const channelMap: Record<string, string> = {
    Email: 'bg-sky-100 text-sky-700 border-sky-200',
    WhatsApp: 'bg-green-100 text-green-700 border-green-200',
    Instagram: 'bg-pink-100 text-pink-700 border-pink-200',
    LinkedIn: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    Website: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  if (category === 'status') {
    return statusMap[value] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  }

  if (category === 'type') {
    return typeMap[value] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return channelMap[value] ?? 'bg-slate-100 text-slate-700 border-slate-200';
};
