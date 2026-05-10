import type { ReactNode } from 'react';
import type { Campaign, CampaignApiStatus } from '../../types/campaign.types';
import { formatCampaignDate, formatCampaignDateTime } from '../../utils/campaign-dates';
import { CampaignTableRowActions } from './campaign-table-row-actions';

interface CampaignsTableProps {
  campaigns: Campaign[];
  canOwnerManageCampaign: (campaign: Campaign) => boolean;
  onView: (campaign: Campaign) => void;
  onEdit: (campaign: Campaign) => void;
  onArchive: (campaign: Campaign) => void;
  footer?: ReactNode;
}

const statusPillClass = (status: CampaignApiStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-[#4edea3]/25 text-[#004b31]';
    case 'ARCHIVED':
      return 'bg-[#e0e3e5] text-[#434653]';
    default:
      return 'bg-[#e0e3e5] text-[#434653]';
  }
};

const statusLabel = (status: CampaignApiStatus) => (status === 'ACTIVE' ? 'Active' : 'Archived');

const thBase =
  'border-none px-4 py-3 align-middle text-[11px] font-bold uppercase tracking-wider text-[#737784] first:pl-5 last:pr-5';

export const CampaignsTable = ({
  campaigns,
  canOwnerManageCampaign,
  onView,
  onEdit,
  onArchive,
  footer
}: CampaignsTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]/80">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-none bg-[#eceef0]">
              <th className={`${thBase} text-left`}>Code</th>
              <th className={`${thBase} text-left`}>Campaign name</th>
              <th className={`${thBase} text-left`}>Type</th>
              <th className={`${thBase} text-left`}>Topic</th>
              <th className={`${thBase} text-center`}>Status</th>
              <th className={`${thBase} text-left`}>Start</th>
              <th className={`${thBase} text-left`}>End</th>
              <th className={`${thBase} text-left`}>Created by</th>
              <th className={`${thBase} text-left`}>Created at</th>
              <th className={`${thBase} text-center`}>Submissions</th>
              <th className={`${thBase} text-center`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="group transition-colors hover:bg-[#eceef0]/30">
                <td className="py-3.5 pl-5 pr-4">
                  <p className="text-xs font-bold text-[#003c90]">{campaign.campaignCode || '—'}</p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm font-bold text-[#191c1e] transition-colors group-hover:text-[#003c90]">
                    {campaign.name}
                  </p>
                </td>
                <td className="px-4 py-3.5 text-xs font-medium text-[#434653]">{campaign.campaignTypeName}</td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex max-w-[9rem] truncate rounded-full bg-[#d5e3fc] px-2.5 py-0.5 text-[11px] font-bold text-[#57657a]">
                    {campaign.topicName || '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex justify-center">
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold tracking-tight ${statusPillClass(campaign.status)}`}
                    >
                      {statusLabel(campaign.status)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-[#434653]">{formatCampaignDate(campaign.startDate)}</td>
                <td className="px-4 py-3.5 text-xs text-[#434653]">
                  {campaign.endDate ? formatCampaignDate(campaign.endDate) : '—'}
                </td>
                <td className="px-4 py-3.5 text-xs font-medium text-[#434653]">{campaign.createdBy}</td>
                <td className="px-4 py-3.5 text-xs text-[#434653]">{formatCampaignDateTime(campaign.createdAt)}</td>
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex justify-center">
                    <span className="text-sm font-bold tabular-nums text-[#191c1e]">
                      {campaign.totalSubmissions.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 pl-4 pr-5 align-middle">
                  <CampaignTableRowActions
                    canOwnerManage={canOwnerManageCampaign(campaign)}
                    onView={() => onView(campaign)}
                    onEdit={() => onEdit(campaign)}
                    onArchive={() => onArchive(campaign)}
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
