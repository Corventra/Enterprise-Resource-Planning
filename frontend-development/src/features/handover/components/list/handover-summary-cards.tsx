import { CheckCircle2, FileText, Hourglass, PencilLine } from 'lucide-react';

interface HandoverSummaryCardsProps {
  summary: {
    totalHandover: number;
    totalDraft: number;
    totalAwaitingApproval: number;
    totalActive: number;
  };
}

const cards = [
  {
    label: 'Total Handover',
    valueKey: 'totalHandover' as const,
    hint: 'Memo',
    hintClass: 'text-[#006544]',
    icon: FileText,
    iconClass: 'text-[#003c90] bg-[#003c90]/10'
  },
  {
    label: 'Drafts',
    valueKey: 'totalDraft' as const,
    hint: 'In Progress',
    hintClass: 'text-[#a16207]',
    icon: PencilLine,
    iconClass: 'text-[#a16207] bg-amber-100'
  },
  {
    label: 'Awaiting Approval',
    valueKey: 'totalAwaitingApproval' as const,
    hint: 'CEO',
    hintClass: 'text-[#003c90]',
    icon: Hourglass,
    iconClass: 'text-[#003c90] bg-[#d5e3fc]'
  },
  {
    label: 'Approved & Active',
    valueKey: 'totalActive' as const,
    hint: 'In Pipeline',
    hintClass: 'text-[#006544]',
    icon: CheckCircle2,
    iconClass: 'text-[#004b31] bg-[#4edea3]/20'
  }
];

export const HandoverSummaryCards = ({ summary }: HandoverSummaryCardsProps) => {
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
