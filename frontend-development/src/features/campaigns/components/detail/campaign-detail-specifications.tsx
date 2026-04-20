import type { Campaign } from '../../types/campaign.types';

interface CampaignDetailSpecificationsProps {
  campaign: Campaign;
}

const formatPeriod = (start: string, end: string) => {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' };
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return `${start} - ${end}`;
  }
  return `${a.toLocaleDateString('en-US', opts)} - ${b.toLocaleDateString('en-US', opts)}`;
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

export const CampaignDetailSpecifications = ({ campaign }: CampaignDetailSpecificationsProps) => {
  const createdDisplay = formatDateTime(campaign.createdAt);
  const updatedDisplay = formatDateTime(campaign.updatedAt);

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#eceef0] sm:p-5">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#434653] sm:text-sm">
        Campaign specifications
      </h2>
      <div className="grid grid-cols-1 gap-y-5 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="mb-0.5 text-[10px] font-bold uppercase text-[#737784]">Campaign ID</p>
          <p className="text-xs font-semibold text-[#191c1e] sm:text-sm">{campaign.id}</p>
        </div>
        <div>
          <p className="mb-0.5 text-[10px] font-bold uppercase text-[#737784]">Period</p>
          <p className="text-xs font-semibold text-[#191c1e] sm:text-sm">{formatPeriod(campaign.startDate, campaign.endDate)}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2 lg:col-span-1">
          <div>
            <p className="mb-0.5 text-[10px] font-bold uppercase text-[#737784]">Created by</p>
            <p className="text-xs font-semibold text-[#191c1e] sm:text-sm">{campaign.createdBy}</p>
          </div>
          <div>
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
