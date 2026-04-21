import type { LeadWorkspaceEngagementLetterItem } from '../types/lead-workspace.types';

interface EngagementLetterHistorySectionProps {
  engagementLetters: LeadWorkspaceEngagementLetterItem[];
  selectedEngagementLetterId?: string;
  onSelectEngagementLetter: (engagementLetterId: string) => void;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const statusLabelMap = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  SENT: 'Sent',
  AWAITING_SIGNATURE: 'Awaiting Signature',
  SIGNED: 'Signed',
  REPLACED: 'Replaced'
} as const;

export const EngagementLetterHistorySection = ({
  engagementLetters,
  selectedEngagementLetterId,
  onSelectEngagementLetter
}: EngagementLetterHistorySectionProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Engagement Letter</h2>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#f2f4f6]/70 text-[11px] font-bold uppercase tracking-wider text-[#737784]">
              <th className="px-5 py-3">Title</th>
              <th className="px-4 py-3">Service Name</th>
              <th className="px-4 py-3">Created At</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-5 py-3 text-right">Agree Fee</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {engagementLetters.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#737784]">
                  No engagement letter data available.
                </td>
              </tr>
            ) : (
              engagementLetters.map((engagementLetter) => (
                <tr
                  key={engagementLetter.id}
                  onClick={() => onSelectEngagementLetter(engagementLetter.id)}
                  className={
                    engagementLetter.id === selectedEngagementLetterId
                      ? 'cursor-pointer border-l-4 border-[#003c90] bg-[#003c90]/5 transition-colors'
                      : 'cursor-pointer border-b border-[#eceef0] transition-colors hover:bg-[#f2f4f6]'
                  }
                >
                  <td className="px-4 py-5 font-semibold text-[#191c1e]">{engagementLetter.title}</td>
                  <td className="px-3 py-5 text-xs text-[#434653]">{engagementLetter.serviceName}</td>
                  <td className="px-3 py-5 text-xs text-[#434653]">{formatDateTime(engagementLetter.createdAt)}</td>
                  <td className="px-3 py-5 text-xs font-semibold text-[#434653]">{statusLabelMap[engagementLetter.status]}</td>
                  <td className="px-6 py-5 text-right text-xs font-semibold text-[#191c1e]">{engagementLetter.agreeFee}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
