import { getCampaignBadgeColor } from '../../utils/get-campaign-badge-color';

interface CampaignTypeBadgeProps {
  label: string;
}

export const CampaignTypeBadge = ({ label }: CampaignTypeBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${getCampaignBadgeColor('type', label)}`}
    >
      {label}
    </span>
  );
};
