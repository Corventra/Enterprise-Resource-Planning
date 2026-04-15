import type { Campaign } from '../../types/campaign.types';
import { CampaignChannelBadge } from '../shared/campaign-channel-badge';
import { CampaignStatusBadge } from '../shared/campaign-status-badge';
import { CampaignTypeBadge } from '../shared/campaign-type-badge';

interface CampaignDetailHeaderProps {
  campaign: Campaign;
}

export const CampaignDetailHeader = ({ campaign }: CampaignDetailHeaderProps) => {
  const createdAt = new Date(campaign.createdAt).toLocaleString();
  const lastUpdated = new Date(campaign.updatedAt).toLocaleString();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{campaign.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{campaign.topic}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CampaignStatusBadge status={campaign.status} />
          <CampaignTypeBadge type={campaign.type} />
          <CampaignChannelBadge channel={campaign.channel} />
        </div>
      </div>

      <div className="mt-4 grid gap-x-6 gap-y-3 border-t border-slate-200 pt-4 text-sm md:grid-cols-2">
        <p className="text-slate-600">
          <span className="font-medium text-slate-800">Campaign ID:</span> {campaign.id}
        </p>
        <p className="text-slate-600">
          <span className="font-medium text-slate-800">Created By:</span> {campaign.createdBy}
        </p>
        <p className="text-slate-600">
          <span className="font-medium text-slate-800">Period:</span> {campaign.startDate} - {campaign.endDate}
        </p>
        <p className="text-slate-600">
          <span className="font-medium text-slate-800">Created At:</span> {createdAt}
        </p>
        <p className="text-slate-600">
          <span className="font-medium text-slate-800">Last Updated:</span> {lastUpdated}
        </p>
        <p className="text-slate-600">
          <span className="font-medium text-slate-800">Notes:</span> {campaign.notes || '-'}
        </p>
      </div>
    </section>
  );
};
