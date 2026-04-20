import { Archive, Inbox, ListChecks, Sparkles } from 'lucide-react';

interface BankDataSummaryCardsProps {
  summary: {
    totalEntries: number;
    newEntries: number;
    processedEntries: number;
    archivedEntries: number;
  };
}

const cards = [
  {
    label: 'Total Entries',
    valueKey: 'totalEntries' as const,
    hint: 'All sources',
    hintClass: 'text-[#006544]',
    icon: ListChecks,
    iconClass: 'text-[#003c90] bg-[#003c90]/10'
  },
  {
    label: 'New',
    valueKey: 'newEntries' as const,
    hint: 'Need action',
    hintClass: 'text-[#0f52ba]',
    icon: Sparkles,
    iconClass: 'text-[#0f52ba] bg-[#d9e2ff]'
  },
  {
    label: 'Processed',
    valueKey: 'processedEntries' as const,
    hint: 'Handled',
    hintClass: 'text-[#006544]',
    icon: Inbox,
    iconClass: 'text-[#004b31] bg-[#4edea3]/20'
  },
  {
    label: 'Archived',
    valueKey: 'archivedEntries' as const,
    hint: 'Stored',
    hintClass: 'text-[#737784]',
    icon: Archive,
    iconClass: 'text-[#515f74] bg-[#e0e3e5]'
  }
];

export const BankDataSummaryCards = ({ summary }: BankDataSummaryCardsProps) => {
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
