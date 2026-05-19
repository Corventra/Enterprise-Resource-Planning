import { FileText, Send } from 'lucide-react';

interface CampaignDetailSummaryCardsProps {
  formsCount: number;
  submissionsCount: number;
}

const cards = [
  {
    key: 'forms',
    label: 'Forms',
    valueKey: 'formsCount' as const,
    borderClass: 'border-l-[#003c90]',
    iconClass: 'text-[#003c90]',
    Icon: FileText
  },
  {
    key: 'submissions',
    label: 'Submissions',
    valueKey: 'submissionsCount' as const,
    borderClass: 'border-l-[#515f74]',
    iconClass: 'text-[#515f74]',
    Icon: Send
  }
] as const;

export const CampaignDetailSummaryCards = ({
  formsCount,
  submissionsCount
}: CampaignDetailSummaryCardsProps) => {
  const values = { formsCount, submissionsCount };

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map(({ key, label, valueKey, borderClass, iconClass, Icon }) => (
        <article
          key={key}
          className={`rounded-xl border border-[#eceef0] border-l-[3px] bg-white p-4 shadow-sm ${borderClass}`}
        >
          <p className="mb-1.5 text-[10px] font-extrabold uppercase text-[#737784]">{label}</p>
          <div className="flex items-end gap-1.5">
            <span className="text-2xl font-black leading-none tracking-tight text-[#191c1e] sm:text-3xl">
              {values[valueKey]}
            </span>
            <Icon className={`mb-px h-5 w-5 shrink-0 ${iconClass}`} strokeWidth={2} />
          </div>
        </article>
      ))}
    </section>
  );
};
