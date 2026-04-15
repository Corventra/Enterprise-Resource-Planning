import type { Campaign } from '../../types/campaign.types';
import { CampaignChannelBadge } from '../shared/campaign-channel-badge';
import { CampaignStatusBadge } from '../shared/campaign-status-badge';
import { CampaignTypeBadge } from '../shared/campaign-type-badge';
import { CampaignTableRowActions } from './campaign-table-row-actions';

interface CampaignsTableProps {
  campaigns: Campaign[];
  onView: (campaign: Campaign) => void;
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
}

export const CampaignsTable = ({ campaigns, onView, onEdit, onDelete }: CampaignsTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Campaign
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Topic Tag
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Channel
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Submissions
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{campaign.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{campaign.topic}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  <CampaignTypeBadge type={campaign.type} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {campaign.topic}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  <CampaignChannelBadge channel={campaign.channel} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  <CampaignStatusBadge status={campaign.status} />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{campaign.totalSubmissions}</td>
                <td className="px-4 py-3 text-right">
                  <CampaignTableRowActions
                    onView={() => onView(campaign)}
                    onEdit={() => onEdit(campaign)}
                    onDelete={() => onDelete(campaign)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
