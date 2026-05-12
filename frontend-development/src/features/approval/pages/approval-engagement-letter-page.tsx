import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { EngagementDocumentCard } from '../../lead-workspace/components/engagement-document-card';
import { EngagementLetterHistorySection } from '../../lead-workspace/components/engagement-letter-history-section';
import { EngagementLetterInfoCard } from '../../lead-workspace/components/engagement-letter-info-card';
import { ApprovalEmptyState } from '../components/approval-empty-state';
import { approvalService } from '../services/approval-service';
import type { ApprovalOutletContext } from '../types/approval.types';

export const ApprovalEngagementLetterPage = () => {
  const { pendingItems, selectedPendingId, queueLoading } = useOutletContext<ApprovalOutletContext>();

  const engagementLetters = useMemo(() => {
    if (!selectedPendingId) return [];
    return approvalService.getEngagementLetters(selectedPendingId);
  }, [selectedPendingId]);

  const [selectedEngagementLetterId, setSelectedEngagementLetterId] = useState<string | null>(
    engagementLetters[0]?.id ?? null
  );

  useEffect(() => {
    if (engagementLetters.length === 0) {
      setSelectedEngagementLetterId(null);
      return;
    }

    const isStillAvailable = engagementLetters.some(
      (engagementLetter) => engagementLetter.id === selectedEngagementLetterId
    );
    if (!isStillAvailable) {
      setSelectedEngagementLetterId(engagementLetters[0].id);
    }
  }, [engagementLetters, selectedEngagementLetterId]);

  const selectedEngagementLetter =
    engagementLetters.find((engagementLetter) => engagementLetter.id === selectedEngagementLetterId) ??
    engagementLetters[0];

  if (queueLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading approval queue...
      </div>
    );
  }

  if (pendingItems.length === 0) {
    return <ApprovalEmptyState />;
  }

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
