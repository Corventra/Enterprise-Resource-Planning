const CHANNEL_LABELS = {
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
  TIKTOK: 'TikTok',
  WEBSITE: 'Website'
};

const formatLeadSourceLabel = (linkType, channelCode, channelName) => {
  if (linkType === 'CHANNEL') {
    const code = channelCode ? String(channelCode).toUpperCase() : '';
    return CHANNEL_LABELS[code] || channelName?.trim() || channelCode?.trim() || 'Channel';
  }
  return 'Primary';
};

module.exports = {
  formatLeadSourceLabel
};
