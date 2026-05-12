import { CheckCircle2, ListChecks, Trophy, XCircle } from 'lucide-react';

interface LeadTrackerSummaryCardsProps {
  summary: {
    totalLeads: number;
    activeLeads: number;
    wonLeads: number;
    lostLeads: number;
  };
}

const cards = [
  {
    label: 'Total Leads',
    valueKey: 'totalLeads' as const,
    hint: 'Pipeline',
    hintClass: 'text-[#006544]',
    icon: ListChecks,
    iconClass: 'text-[#003c90] bg-[#003c90]/10'
  },
  {
    label: 'Active',
    valueKey: 'activeLeads' as const,
    hint: 'In progress',
    hintClass: 'text-[#00419c]',
    icon: CheckCircle2,
    iconClass: 'text-[#00419c] bg-[#d9e2ff]'
  },
  {
    label: 'Won',
    valueKey: 'wonLeads' as const,
    hint: 'Closed won',
    hintClass: 'text-[#006544]',
    icon: Trophy,
    iconClass: 'text-[#004b31] bg-[#4edea3]/20'
  },
  {
    label: 'Lost',
    valueKey: 'lostLeads' as const,
    hint: 'Closed lost',
    hintClass: 'text-[#737784]',
    icon: XCircle,
    iconClass: 'text-[#737784] bg-[#e0e3e5]'
  }
];

export const LeadTrackerSummaryCards = ({ summary }: LeadTrackerSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, valueKey, hint, hintClass, icon: Icon, iconClass }) => (
        <div key={valueKey} className="flex flex-col justify-between rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#eceef0]">
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
