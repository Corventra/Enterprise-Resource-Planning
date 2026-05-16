import type { Campaign } from '../../types/campaign.types';
import { formatCampaignDate, formatCampaignDateTime } from '../../utils/campaign-dates';

interface CampaignDetailSpecificationsProps {
  campaign: Campaign;
}

const formatPeriod = (start: string, end: string | null) => {
  const a = formatCampaignDate(start);
  if (!end) return `${a} — ongoing`;
  return `${a} — ${formatCampaignDate(end)}`;
};

export const CampaignDetailSpecifications = ({ campaign }: CampaignDetailSpecificationsProps) => {
  const createdDisplay = formatCampaignDateTime(campaign.createdAt);
  const updatedDisplay = formatCampaignDateTime(campaign.updatedAt);

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#eceef0] sm:p-5">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#434653] sm:text-sm">
        Campaign specifications
      </h2>
      <div className="grid grid-cols-1 items-start gap-y-6 gap-x-0 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2.25fr)] lg:gap-x-5 lg:gap-y-6">
        <div className="min-w-0">
          <p className="mb-0.5 text-[10px] font-bold uppercase text-[#737784]">Campaign code</p>
          <p className="text-xs font-semibold text-[#191c1e] sm:text-sm">{campaign.campaignCode || '—'}</p>
        </div>
        <div className="min-w-0">
          <p className="mb-0.5 text-[10px] font-bold uppercase text-[#737784]">Period</p>
          <p className="text-xs font-semibold text-[#191c1e] sm:text-sm">{formatPeriod(campaign.startDate, campaign.endDate)}</p>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-y-6 gap-x-0 sm:col-span-2 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-0 lg:col-span-1 lg:grid-cols-2 lg:gap-x-6">
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] font-bold uppercase text-[#737784]">Created by</p>
            <p className="text-xs font-semibold text-[#191c1e] sm:text-sm">{campaign.createdBy}</p>
          </div>
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] font-bold uppercase text-[#737784]">Created at</p>
            <p className="text-xs font-semibold text-[#191c1e] sm:text-sm">{createdDisplay}</p>
          </div>
        </div>
        <div>
          <p className="mb-0.5 text-[10px] font-bold uppercase text-[#737784]">Updated at</p>
          <p className="text-xs font-semibold text-[#191c1e] sm:text-sm">{updatedDisplay}</p>
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <p className="mb-0.5 text-[10px] font-bold uppercase text-[#737784]">Notes</p>
          <p className="text-xs leading-relaxed text-[#3a485b] sm:text-sm">{campaign.notes?.trim() || '—'}</p>
        </div>
      </div>
    </section>
  );
};
