interface CampaignDetailSummaryCardsProps {
  formsCount: number;
  submissionsCount: number;
  qualifiedSubmissions: number;
  bankEntriesCount: number;
}

export const CampaignDetailSummaryCards = ({
  formsCount,
  submissionsCount,
  qualifiedSubmissions,
  bankEntriesCount
}: CampaignDetailSummaryCardsProps) => {
  const cards = [
    { label: 'Forms', value: formsCount },
    { label: 'Submissions', value: submissionsCount },
    { label: 'Qualified', value: qualifiedSubmissions },
    { label: 'Bank Data Entries', value: bankEntriesCount }
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
        </article>
      ))}
    </section>
  );
};
