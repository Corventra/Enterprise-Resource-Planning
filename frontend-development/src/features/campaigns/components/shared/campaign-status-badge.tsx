import { getCampaignBadgeColor } from '../../utils/get-campaign-badge-color';

interface CampaignStatusBadgeProps {
  status: string;
}

export const CampaignStatusBadge = ({ status }: CampaignStatusBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${getCampaignBadgeColor('status', status)}`}
    >
      {status}
    </span>
  );
};
