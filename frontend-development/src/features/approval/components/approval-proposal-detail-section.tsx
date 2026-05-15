import { Download, FileStack, FileText, Info } from 'lucide-react';
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
    !isReadOnly && proposal?.status === 'WAITING_CEO_APPROVAL' && (onApprove || onReject);
  const documentUrl = proposal?.document ? `${getApiOrigin()}${proposal.document.filePath}` : null;

  return (
    <aside className="col-span-12 flex flex-col gap-4 lg:col-span-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Proposal detail</h2>
      </div>

      <ApprovalLeadCoreSummary summary={leadSummary} isLoading={leadSummaryLoading} />

      <div className="flex max-h-[min(70vh,720px)] flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        {proposal ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-0 overflow-y-auto">
              <section className="border-b border-[#eceef0] p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-base font-bold text-[#191c1e]">
                    <Info className="h-5 w-5 shrink-0 text-[#003c90]" />
                    Ringkasan proposal
                  </h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${proposalStatusClassMap[proposal.status]}`}>
                    {getProposalStatusLabel(proposal.status)}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Service</p>
                    <p className="mt-1 text-sm font-semibold text-[#191c1e]">{proposal.serviceName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Proposal code</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-[#191c1e]">
                      {proposal.proposalCode?.trim() ? proposal.proposalCode : `— (legacy #${proposal.id})`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Service class</p>
                    <p className="mt-1 text-sm font-semibold text-[#191c1e]">{proposal.serviceClassName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Issuer company</p>
                    <p className="mt-1 text-sm font-semibold text-[#191c1e]">{proposal.issuerCompany}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Proposal fee</p>
                    <p className="mt-1 text-sm font-semibold text-[#191c1e]">{formatProposalCurrency(proposal.proposalFee)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Discount</p>
                    <p className="mt-1 text-sm font-semibold text-[#ba1a1a]">{formatProposalCurrency(proposal.discountAmount)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Final fee</p>
                    <p className="mt-1 text-sm font-bold text-[#004b31]">
                      {formatProposalCurrency(proposal.proposalFee - proposal.discountAmount)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="border-b border-[#eceef0] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <FileStack className="h-4 w-4 text-[#003c90]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#191c1e]">Sub contract</h4>
                </div>
                {proposal.isSubContract ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#737784]">Partner</p>
                      <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{proposal.partnerName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#737784]">Payer party</p>
                      <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{formatProposalPayerParty(proposal.payerParty)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#737784]">Tidak menggunakan sub contract.</p>
                )}
              </section>

              <section className="border-b border-[#eceef0] p-5">
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#191c1e]">
                  <FileText className="h-5 w-5 shrink-0 text-[#003c90]" />
                  Latest proposal document
                </h3>
                {proposal.document && documentUrl ? (
                  <div className="rounded-xl border border-[#c3c6d5]/50 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-[#c3c6d5]/70 bg-[#d5e3fc]/20">
                        <FileText className="h-8 w-8 text-[#003c90]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#191c1e]">{proposal.document.documentName}</p>
                        <p className="mt-1 text-[11px] text-[#737784]">
                          Version <span className="font-semibold">{proposal.document.versionNo}</span>
                          <span className="mx-1.5 text-[#c3c6d5]">·</span>
                          Uploaded at {formatProposalDateTime(proposal.document.createdAt)}
                        </p>
                      </div>
                      <a
                        href={documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#c3c6d5] bg-white px-3 py-2 text-xs font-bold text-[#003c90] hover:bg-[#f2f4f6]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Buka / unduh
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#737784]">-</p>
                )}
              </section>

              <section className="border-b border-[#eceef0] p-5">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#191c1e]">Alur pengajuan</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#737784]">Created by</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{proposal.createdByName || '-'}</p>
                    <p className="mt-0.5 text-xs text-[#737784]">{formatProposalDateTime(proposal.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#737784]">Submitted by</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{proposal.submittedByName || '-'}</p>
                    <p className="mt-0.5 text-xs text-[#737784]">{formatProposalDateTime(proposal.submittedAt)}</p>
                  </div>
                </div>
              </section>

              {isNeedRevision ? (
                <section className="p-5">
                  <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-orange-900">Catatan revisi CEO</h4>
                  <p className="whitespace-pre-wrap rounded-lg border border-orange-200 bg-orange-50/80 p-3 text-sm font-medium text-[#7c2d12]">
                    {proposal.revisionNote?.trim() || '-'}
                  </p>
                </section>
              ) : null}
            </div>

            {showApprovalActions ? (
              <div className="border-t border-[#eceef0] px-5 py-4">
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
