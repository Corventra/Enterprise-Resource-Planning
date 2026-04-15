import type { Channel } from '../../types/campaign.types';
import { formatChannel } from '../../utils/format-channel';
import { getCampaignBadgeColor } from '../../utils/get-campaign-badge-color';

interface CampaignChannelBadgeProps {
  channel: Channel;
}

export const CampaignChannelBadge = ({ channel }: CampaignChannelBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${getCampaignBadgeColor('channel', channel)}`}
    >
      {formatChannel(channel)}
    </span>
  );
};
