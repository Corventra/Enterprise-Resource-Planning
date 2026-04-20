import { BarChart2, Bolt, Inbox, LayoutGrid } from 'lucide-react';

interface CampaignsSummaryCardsProps {
  summary: {
    total: number;
    active: number;
    totalSubmissions: number;
    averagePerCampaign: number;
  };
}

const cards = [
  {
    label: 'Total Campaigns',
    valueKey: 'total' as const,
    hint: 'All sources',
    hintClass: 'text-[#006544]',
    icon: LayoutGrid,
    iconClass: 'text-[#003c90] bg-[#003c90]/10'
  },
  {
    label: 'Active Campaigns',
    valueKey: 'active' as const,
    hint: 'Live now',
    hintClass: 'text-[#006544]',
    icon: Bolt,
    iconClass: 'text-[#004b31] bg-[#004b31]/10'
  },
  {
    label: 'Total Submissions',
    valueKey: 'totalSubmissions' as const,
    hint: 'Pipeline',
    hintClass: 'text-[#0f52ba]',
    icon: Inbox,
    iconClass: 'text-[#515f74] bg-[#515f74]/10'
  },
  {
    label: 'Average / Campaign',
    valueKey: 'averagePerCampaign' as const,
    hint: 'Per campaign',
    hintClass: 'text-[#737784]',
    icon: BarChart2,
    iconClass: 'text-[#00419c] bg-[#d5e3fc]'
  }
];

export const CampaignsSummaryCards = ({ summary }: CampaignsSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, valueKey, hint, hintClass, icon: Icon, iconClass }) => (
        <div
          key={valueKey}
          className="flex flex-col justify-between rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#eceef0]"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className={`rounded-full p-2 ${iconClass}`}>
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className={`text-[11px] font-bold ${hintClass}`}>{hint}</span>
          </div>
          <div>
            <p className="mb-0.5 text-xs font-medium text-[#737784]">{label}</p>
            <h3 className="text-2xl font-semibold tracking-tight text-[#191c1e]">{summary[valueKey]}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};
