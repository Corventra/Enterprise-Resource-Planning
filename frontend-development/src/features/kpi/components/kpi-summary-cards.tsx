import { CheckCircle2, Lock, TrendingUp, Users } from 'lucide-react';

interface KpiSummaryCardsProps {
  summary: {
    averageTotal: number;
    consultantCount: number;
    finalizedCount: number;
    period: string;
  };
}

const cards = [
  {
    label: 'Average KPI',
    valueKey: 'averageTotal' as const,
    formatter: (v: number) => `${v.toFixed(1)}%`,
    hint: 'All-Consultants',
    hintClass: 'text-[#003c90]',
    icon: TrendingUp,
    iconClass: 'text-[#003c90] bg-[#003c90]/10'
  },
  {
    label: 'Consultants Tracked',
    valueKey: 'consultantCount' as const,
    formatter: (v: number) => `${v}`,
    hint: 'Active',
    hintClass: 'text-[#006544]',
    icon: Users,
    iconClass: 'text-[#003c90] bg-[#d5e3fc]'
  },
  {
    label: 'Finalized Snapshots',
    valueKey: 'finalizedCount' as const,
    formatter: (v: number) => `${v}`,
    hint: 'Locked',
    hintClass: 'text-[#006544]',
    icon: Lock,
    iconClass: 'text-[#004b31] bg-[#4edea3]/20'
  },
  {
    label: 'Current Period',
    valueKey: 'period' as const,
    formatter: (v: string) => v,
    hint: 'Monthly',
    hintClass: 'text-[#a16207]',
    icon: CheckCircle2,
    iconClass: 'text-[#a16207] bg-amber-100'
  }
];

export const KpiSummaryCards = ({ summary }: KpiSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, valueKey, formatter, hint, hintClass, icon: Icon, iconClass }) => (
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
            <h3 className="text-2xl font-semibold tracking-tight text-[#191c1e]">
              {formatter(summary[valueKey] as never)}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
};
