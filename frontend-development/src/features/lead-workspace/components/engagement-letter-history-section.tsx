import { useOutletContext } from 'react-router';
import { useLeadWorkspacePermissions } from '../hooks/use-lead-workspace-permissions';
import type { LeadWorkspaceEngagementLetterItem } from '../types/lead-engagement-letters.types';
import type { LeadWorkspaceOutletContext } from '../types/lead-workspace.types';
import {
  engagementStatusClassMap,
  engagementStatusLabelMap,
  paymentMethodLabelMap
} from '../utils/engagement-letter-labels';

interface EngagementLetterHistorySectionProps {
  engagementLetters: LeadWorkspaceEngagementLetterItem[];
  selectedEngagementLetterId?: string;
  onSelectEngagementLetter: (engagementLetterId: string) => void;
  onCreateEngagementLetter?: () => void;
  /** Proposal siap EL (mis. status Responded) — dari bundle API */
  canCreateEngagementLetter?: boolean;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const EngagementLetterHistorySection = ({
  engagementLetters,
  selectedEngagementLetterId,
  onSelectEngagementLetter,
  onCreateEngagementLetter,
  canCreateEngagementLetter = false
}: EngagementLetterHistorySectionProps) => {
  const { processedByUserId } = useOutletContext<LeadWorkspaceOutletContext>();
  const { canManageLeadWorkspace } = useLeadWorkspacePermissions({ processedByUserId });
  const showCreate =
    canManageLeadWorkspace &&
    canCreateEngagementLetter &&
    engagementLetters.length === 0 &&
    Boolean(onCreateEngagementLetter);

  return (
    <div className="col-span-12 flex flex-col gap-4 lg:col-span-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Engagement letter</h2>
        {showCreate ? (
          <button
            type="button"
            onClick={onCreateEngagementLetter}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-3 py-2 text-xs font-bold text-white shadow-sm shadow-[#003c90]/20 transition-opacity hover:opacity-90 sm:px-4 sm:text-sm"
          >
            Create Engagement Letter
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#f2f4f6]/70 text-[11px] font-bold uppercase tracking-wider text-[#737784]">
              <th className="px-4 py-3">Issuer</th>
              <th className="px-3 py-3">Payment</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Created at</th>
              <th className="px-4 py-3 text-right">Agreed fee</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {engagementLetters.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#737784]">
                  Belum ada engagement letter untuk lead ini.
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
                  <td className="px-4 py-4 text-xs font-semibold text-[#191c1e]">{engagementLetter.issuerCompany}</td>
                  <td className="px-3 py-4 text-xs text-[#434653]">
                    {paymentMethodLabelMap[engagementLetter.paymentMethod]}
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${engagementStatusClassMap[engagementLetter.engagementStatus]}`}
                    >
                      {engagementStatusLabelMap[engagementLetter.engagementStatus]}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-xs text-[#434653]">{formatDateTime(engagementLetter.createdAt)}</td>
                  <td className="px-4 py-4 text-right text-xs font-semibold text-[#191c1e]">{engagementLetter.agreedFee}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
