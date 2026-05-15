import type { HandoverDetail } from '../../handover/types/handover.types';
import { HandoverActivityLogPanel } from '../../handover/components/detail/handover-activity-log-panel';
import { HandoverDocumentSections } from '../../handover/components/detail/handover-document-sections';
import type { ApprovalProposalLeadSummary } from '../types/approval.types';
import { ApprovalLeadCoreSummary } from './approval-lead-core-summary';

interface ApprovalHandoverDetailSectionProps {
  leadSummary: ApprovalProposalLeadSummary | null;
  leadSummaryLoading?: boolean;
  detail: HandoverDetail | null;
  detailLoading?: boolean;
  detailError?: string | null;
  ceoRevisionNote?: string | null;
  isReadOnly?: boolean;
  actionsDisabled?: boolean;
  onApprove?: () => void;
  onRequestRevision?: () => void;
}

export const ApprovalHandoverDetailSection = ({
  leadSummary,
  leadSummaryLoading = false,
  detail,
  detailLoading = false,
  detailError,
  ceoRevisionNote,
  isReadOnly = false,
  actionsDisabled = false,
  onApprove,
  onRequestRevision
}: ApprovalHandoverDetailSectionProps) => {
  return (
    <div className="col-span-12 flex flex-col gap-4 lg:col-span-5">
      <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Detail handover</h2>

      <ApprovalLeadCoreSummary summary={leadSummary} isLoading={leadSummaryLoading} />

      {ceoRevisionNote ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800">CEO revision note</p>
          <p className="mt-1 whitespace-pre-wrap">{ceoRevisionNote}</p>
        </div>
      ) : null}

      {detailError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{detailError}</p>
      ) : null}

      {detailLoading ? (
        <p className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784]">Memuat detail handover…</p>
      ) : detail ? (
        <div className="max-h-[min(70vh,900px)] space-y-4 overflow-y-auto pr-1">
          <HandoverDocumentSections detail={detail} />
          <HandoverActivityLogPanel entries={detail.activityLogs} />
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-[#c3c6d5] bg-white p-6 text-center text-sm text-[#737784]">
          Pilih handover dari daftar untuk melihat detail.
        </p>
      )}

      {!isReadOnly && detail ? (
        <div className="flex flex-wrap gap-2 border-t border-[#eceef0] pt-4">
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={onApprove}
            className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Approve Handover
          </button>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={onRequestRevision}
            className="inline-flex items-center gap-2 rounded-lg border border-[#c3c6d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#191c1e] hover:bg-[#f2f4f6] disabled:opacity-50"
          >
            Tolak / Minta Revisi
          </button>
        </div>
      ) : null}
    </div>
  );
};
