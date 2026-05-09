import { ArrowLeft, Trash2 } from 'lucide-react';
import type { Campaign, CampaignStatus } from '../../types/campaign.types';
import { formatChannel } from '../../utils/format-channel';

interface CampaignDetailHeaderProps {
  campaign: Campaign;
  canManageCampaigns: boolean;
  onBack: () => void;
  onEditCampaign: () => void;
  onDeleteCampaign: () => void;
}

const statusBadgeClass = (status: CampaignStatus): string => {
  switch (status) {
    case 'Active':
      return 'bg-[#4edea3]/25 text-[#004b31]';
    case 'Draft':
      return 'bg-[#d9e2ff] text-[#00419c]';
    case 'Paused':
      return 'bg-[#e0e3e5] text-[#434653]';
    case 'Completed':
      return 'bg-[#e0e3e5] text-[#434653]';
    default:
      return 'bg-[#e0e3e5] text-[#434653]';
  }
};

export const CampaignDetailHeader = ({
  campaign,
  canManageCampaigns,
  onBack,
  onEditCampaign,
  onDeleteCampaign
}: CampaignDetailHeaderProps) => {
  return (
    <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="group mb-2 inline-flex items-center text-xs font-medium text-[#434653] transition-colors hover:text-[#003c90] sm:text-sm"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 sm:h-4 sm:w-4" />
          Back to Campaigns
        </button>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[#191c1e] sm:text-3xl">{campaign.name}</h1>
          <div className="flex flex-wrap gap-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-[11px] ${statusBadgeClass(campaign.status)}`}
            >
              {campaign.status}
            </span>
            <span className="rounded-full bg-[#d5e3fc] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#57657a] sm:text-[11px]">
              {campaign.type}
            </span>
            <span className="rounded-full bg-[#e0e3e5] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#434653] sm:text-[11px]">
              {formatChannel(campaign.channel)}
            </span>
          </div>
        </div>
      </div>
      {canManageCampaigns ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onDeleteCampaign}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#991b1b_0%,#dc2626_100%)] px-5 py-2 text-xs font-bold text-white shadow-md shadow-red-600/25 transition-opacity hover:opacity-90 sm:text-sm"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
            Delete
          </button>
          <button
            type="button"
            onClick={onEditCampaign}
            className="rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 sm:text-sm"
          >
            Edit Campaign
          </button>
        </div>
      ) : null}
    </header>
  );
};
