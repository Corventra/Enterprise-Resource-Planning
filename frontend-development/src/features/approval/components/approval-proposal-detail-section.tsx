import { Download, FileText } from 'lucide-react';
import { getApiOrigin } from '../../../services/api-client';
import type { LeadWorkspaceProposalView } from '../../lead-workspace/types/lead-proposals.types';
import type { ApprovalProposalLeadSummary } from '../types/approval.types';
import {
  formatProposalCurrency,
  formatProposalDateTime,
  formatProposalPayerParty,
  getProposalStatusLabel,
  proposalStatusClassMap
} from '../utils/proposal-display';
import { ApprovalLeadCoreSummary } from './approval-lead-core-summary';

interface ApprovalProposalDetailSectionProps {
  proposal: LeadWorkspaceProposalView | null;
  leadSummary: ApprovalProposalLeadSummary | null;
  leadSummaryLoading?: boolean;
  isReadOnly?: boolean;
  actionsDisabled?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

export const ApprovalProposalDetailSection = ({
  proposal,
  leadSummary,
  leadSummaryLoading = false,
  isReadOnly = false,
  actionsDisabled = false,
  onApprove,
  onReject
}: ApprovalProposalDetailSectionProps) => {
  const isNeedRevision = proposal?.status === 'NEED_REVISION';
  const showApprovalActions =
    !isReadOnly &&
    proposal?.status === 'WAITING_CEO_APPROVAL' &&
    (onApprove || onReject);
  const documentUrl = proposal?.document ? `${getApiOrigin()}${proposal.document.filePath}` : null;

  return (
    <aside className="col-span-12 flex flex-col gap-4 lg:col-span-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Proposal Detail</h2>
      </div>

      <ApprovalLeadCoreSummary summary={leadSummary} isLoading={leadSummaryLoading} />

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        {proposal ? (
          <div className="flex flex-1 flex-col">
            <div className="bg-gradient-to-r from-[#f2f4f6] to-[#f2f4f6]/40 p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold leading-tight text-[#191c1e]">{proposal.serviceName}</h3>
                  <p className="mt-1 text-xs text-[#434653]">Proposal ID: #{proposal.id}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${proposalStatusClassMap[proposal.status]}`}>
                  {getProposalStatusLabel(proposal.status)}
                </span>
              </div>
              <p className="text-xs text-[#515f74]">
                {proposal.serviceClassName} - {proposal.issuerCompany}
              </p>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              {isNeedRevision ? (
                <section className="rounded-xl border border-orange-200 bg-orange-50/80 px-4 py-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#a16207]">Revision Note</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[#7c2d12]">
                    {proposal.revisionNote?.trim() || '-'}
                  </p>
                </section>
              ) : null}

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#737784]">Service Class</p>
                  <p className="text-sm font-semibold text-[#191c1e]">{proposal.serviceClassName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#737784]">Service</p>
                  <p className="text-sm font-semibold text-[#191c1e]">{proposal.serviceName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#737784]">Issuer Company</p>
                  <p className="text-sm font-semibold text-[#191c1e]">{proposal.issuerCompany}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#737784]">Proposal Fee</p>
                  <p className="text-sm font-semibold text-[#191c1e]">{formatProposalCurrency(proposal.proposalFee)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#737784]">Discount</p>
                  <p className="text-sm font-semibold text-[#ba1a1a]">{formatProposalCurrency(proposal.discountAmount)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#737784]">Final Fee</p>
                  <p className="text-sm font-semibold text-[#004b31]">
                    {formatProposalCurrency(proposal.proposalFee - proposal.discountAmount)}
                  </p>
                </div>
              </section>

              <section className="rounded-xl border border-[#c3c6d5]/30 p-4">
                <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-[#434653]">Sub Contract</h4>
                {proposal.isSubContract ? (
                  <div className="space-y-2 text-sm text-[#434653]">
                    <p>
                      <span className="font-semibold text-[#191c1e]">Partner:</span> {proposal.partnerName || '-'}
                    </p>
                    <p>
                      <span className="font-semibold text-[#191c1e]">Payer Party:</span>{' '}
                      {formatProposalPayerParty(proposal.payerParty)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[#737784]">Tidak menggunakan sub contract.</p>
                )}
              </section>

              <section>
                <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-[#434653]">Document</h4>
                {proposal.document && documentUrl ? (
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 rounded-lg bg-[#eceef0] p-3 transition-colors hover:bg-[#e0e3e5]"
                  >
                    <FileText className="h-4 w-4 text-[#515f74]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-[#191c1e]">{proposal.document.documentName}</p>
                      <p className="text-[10px] text-[#737784]">Version {proposal.document.versionNo}</p>
                    </div>
                    <Download className="h-4 w-4 text-[#737784] group-hover:text-[#003c90]" />
                  </a>
                ) : (
                  <p className="text-sm text-[#737784]">-</p>
                )}
              </section>

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#737784]">Submitted By</p>
                  <p className="text-sm font-semibold text-[#191c1e]">{proposal.submittedByName || '-'}</p>
                  <p className="text-xs text-[#737784]">{formatProposalDateTime(proposal.submittedAt)}</p>
                </div>
              </section>
            </div>

            {showApprovalActions ? (
              <div className="border-t border-[#c3c6d5]/30 px-6 py-4">
                <div className="flex flex-wrap justify-end gap-2">
                  {onReject ? (
                    <button
                      type="button"
                      disabled={actionsDisabled}
                      onClick={onReject}
                      className="rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60 sm:text-sm"
                    >
                      Reject Proposal
                    </button>
                  ) : null}
                  {onApprove ? (
                    <button
                      type="button"
                      disabled={actionsDisabled}
                      onClick={onApprove}
                      className="rounded-lg bg-[#003c90] px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60 sm:text-sm"
                    >
                      Approve Proposal
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="p-6 text-sm text-[#737784]">Belum ada proposal untuk ditampilkan.</div>
        )}
      </div>
    </aside>
  );
};
