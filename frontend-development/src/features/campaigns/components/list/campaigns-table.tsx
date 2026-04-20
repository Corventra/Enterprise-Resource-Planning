import { Globe, Link2, Mail, MessageCircle, Share2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Campaign, CampaignStatus, Channel } from '../../types/campaign.types';
import { formatChannel } from '../../utils/format-channel';
import { CampaignTableRowActions } from './campaign-table-row-actions';

interface CampaignsTableProps {
  campaigns: Campaign[];
  onView: (campaign: Campaign) => void;
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  footer?: ReactNode;
}

const channelIcon = (channel: Channel) => {
  const iconClass = 'h-4 w-4 shrink-0 text-[#737784]';
  switch (channel) {
    case 'Email':
      return <Mail className={iconClass} />;
    case 'WhatsApp':
      return <MessageCircle className={iconClass} />;
    case 'Instagram':
      return <Share2 className={iconClass} />;
    case 'LinkedIn':
      return <Link2 className={iconClass} />;
    case 'Website':
      return <Globe className={iconClass} />;
    default:
      return <Globe className={iconClass} />;
  }
};

const statusPillClass = (status: CampaignStatus): string => {
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

const thBase =
  'border-none px-4 py-3 align-middle text-[11px] font-bold uppercase tracking-wider text-[#737784] first:pl-5 last:pr-5';

export const CampaignsTable = ({ campaigns, onView, onEdit, onDelete, footer }: CampaignsTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]/80">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-none bg-[#eceef0]">
              <th className={`${thBase} text-left`}>Campaign name</th>
              <th className={`${thBase} text-left`}>Type</th>
              <th className={`${thBase} text-left`}>Topic tag</th>
              <th className={`${thBase} text-left`}>Channel</th>
              <th className={`${thBase} text-center`}>Status</th>
              <th className={`${thBase} text-center`}>Submissions</th>
              <th className={`${thBase} text-center`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="group transition-colors hover:bg-[#eceef0]/30">
                <td className="py-3.5 pl-5 pr-4">
                  <p className="text-sm font-bold text-[#191c1e] transition-colors group-hover:text-[#003c90]">
                    {campaign.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#737784]">Ref: {campaign.id.slice(0, 8).toUpperCase()}</p>
                </td>
                <td className="px-4 py-3.5 text-xs font-medium text-[#434653]">{campaign.type}</td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex max-w-[9rem] truncate rounded-full bg-[#d5e3fc] px-2.5 py-0.5 text-[11px] font-bold text-[#57657a]">
                    {campaign.topic || '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    {channelIcon(campaign.channel)}
                    <span className="text-xs text-[#434653]">{formatChannel(campaign.channel)}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex justify-center">
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold tracking-tight ${statusPillClass(campaign.status)}`}
                    >
                      {campaign.status}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex justify-center">
                    <span className="text-sm font-bold tabular-nums text-[#191c1e]">
                      {campaign.totalSubmissions.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 pl-4 pr-5 align-middle">
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
      {footer}
    </div>
  );
};
