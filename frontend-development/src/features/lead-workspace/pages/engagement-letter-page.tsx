import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { EngagementDocumentCard } from '../components/engagement-document-card';
import { EngagementLetterHistorySection } from '../components/engagement-letter-history-section';
import { EngagementLetterInfoCard } from '../components/engagement-letter-info-card';
import type { LeadWorkspaceOutletContext } from '../types/lead-workspace.types';

export const EngagementLetterPage = () => {
  const { workspace } = useOutletContext<LeadWorkspaceOutletContext>();
  const engagementLetters = useMemo(() => workspace.engagementLetters, [workspace.engagementLetters]);
  const [selectedEngagementLetterId, setSelectedEngagementLetterId] = useState<string | null>(engagementLetters[0]?.id ?? null);

  useEffect(() => {
    if (engagementLetters.length === 0) {
      setSelectedEngagementLetterId(null);
      return;
    }

    const isStillAvailable = engagementLetters.some((engagementLetter) => engagementLetter.id === selectedEngagementLetterId);
    if (!isStillAvailable) {
      setSelectedEngagementLetterId(engagementLetters[0].id);
    }
  }, [engagementLetters, selectedEngagementLetterId]);

  const selectedEngagementLetter =
    engagementLetters.find((engagementLetter) => engagementLetter.id === selectedEngagementLetterId) ?? engagementLetters[0];

  return (
    <section className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-7">
        <EngagementLetterHistorySection
          engagementLetters={engagementLetters}
          selectedEngagementLetterId={selectedEngagementLetter?.id}
          onSelectEngagementLetter={setSelectedEngagementLetterId}
        />
      </div>
      <div className="col-span-12 space-y-4 lg:col-span-5">
        <h2 className="mb-4 text-xl font-bold tracking-tight text-[#191c1e]">Engagement Detail</h2>
        <EngagementLetterInfoCard engagementLetter={selectedEngagementLetter} />
        <EngagementDocumentCard engagementLetter={selectedEngagementLetter} />
      </div>
    </section>
  );
};
