interface CampaignsSummaryCardsProps {
  summary: {
    total: number;
    active: number;
    totalSubmissions: number;
    averagePerCampaign: number;
  };
}

const cardClassName = 'rounded-xl border border-slate-200 bg-white p-4';

export const CampaignsSummaryCards = ({ summary }: CampaignsSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className={cardClassName}>
        <p className="text-sm text-slate-500">Total Campaigns</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.total}</p>
      </div>
      <div className={cardClassName}>
        <p className="text-sm text-slate-500">Active Campaigns</p>
        <p className="mt-1 text-2xl font-semibold text-emerald-700">{summary.active}</p>
      </div>
      <div className={cardClassName}>
        <p className="text-sm text-slate-500">Total Submissions</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.totalSubmissions}</p>
      </div>
      <div className={cardClassName}>
        <p className="text-sm text-slate-500">Average / Campaign</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.averagePerCampaign}</p>
      </div>
    </div>
  );
};
