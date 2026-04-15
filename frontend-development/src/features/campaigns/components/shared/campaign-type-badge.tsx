import type { CampaignType } from '../../types/campaign.types';
import { getCampaignBadgeColor } from '../../utils/get-campaign-badge-color';

interface CampaignTypeBadgeProps {
  type: CampaignType;
}

export const CampaignTypeBadge = ({ type }: CampaignTypeBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${getCampaignBadgeColor('type', type)}`}
    >
      {type}
    </span>
  );
};
