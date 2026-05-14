import { Download, FileStack, FileText, Info } from 'lucide-react';
import { useOutletContext } from 'react-router';
import { getApiOrigin } from '../../../services/api-client';
import { useLeadWorkspacePermissions } from '../hooks/use-lead-workspace-permissions';
import type { LeadWorkspaceOutletContext } from '../types/lead-workspace.types';
import type { LeadWorkspaceProposalView } from '../types/lead-proposals.types';

interface ProposalDetailSectionProps {
  proposal: LeadWorkspaceProposalView | null;
  onEditProposal: () => void;
  /** Dipakai saat belum ada proposal (empty state selaras Engagement Letter). */
  onCreateProposal?: () => void;
  onDeleteDraft: () => void;
  deleteBusy?: boolean;
  processedByUserId?: number | null;
  onSendToClient?: () => void;
  onMarkResponded?: () => void;
  lifecycleActionsDisabled?: boolean;
  withGridColumn?: boolean;
}

const formatDateTime = (iso: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const statusLabelMap = {
  DRAFT: 'Draft',
  WAITING_CEO_APPROVAL: 'Waiting CEO Approval',
  NEED_REVISION: 'Need Revision',
  APPROVED: 'Approved',
  SENT: 'Sent',
  RESPONDED: 'Responded'
} as const;

const statusClassMap = {
  DRAFT: 'bg-slate-100 text-slate-700',
  WAITING_CEO_APPROVAL: 'bg-amber-100 text-amber-900',
  NEED_REVISION: 'bg-orange-100 text-orange-900',
  APPROVED: 'bg-[#006544]/10 text-[#006544]',
  SENT: 'bg-blue-100 text-blue-900',
  RESPONDED: 'bg-violet-100 text-violet-900'
} as const;

export const ProposalDetailSection = ({
  proposal,
  onEditProposal,
  onCreateProposal,
  onDeleteDraft,
  deleteBusy = false,
  processedByUserId: processedByUserIdProp,
  onSendToClient,
  onMarkResponded,
  lifecycleActionsDisabled = false,
  withGridColumn = true
}: ProposalDetailSectionProps) => {
  const outletContext = useOutletContext<LeadWorkspaceOutletContext | undefined>();
  const processedByUserId = processedByUserIdProp ?? outletContext?.processedByUserId ?? null;
  const { canViewLeadWorkspace, canManageLeadWorkspace } = useLeadWorkspacePermissions({
    processedByUserId
  });
  const isDraft = proposal?.status === 'DRAFT';
  const isNeedRevision = proposal?.status === 'NEED_REVISION';
  const canEditProposal = isDraft || isNeedRevision;
  const showManageActions = canManageLeadWorkspace && proposal && canEditProposal;
  const showSendToClientAction =
    proposal?.status === 'APPROVED' && canManageLeadWorkspace && Boolean(onSendToClient);
  const showMarkRespondedAction =
    proposal?.status === 'SENT' && canManageLeadWorkspace && Boolean(onMarkResponded);
  const documentUrl = proposal?.document ? `${getApiOrigin()}${proposal.document.filePath}` : null;
  const revisionNote = proposal?.revisionNote?.trim() ?? '';

  return (
    <aside className={`flex flex-col gap-4 ${withGridColumn ? 'col-span-12 lg:col-span-5' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Proposal detail</h2>
      </div>

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
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClassMap[proposal.status]}`}>
                    {statusLabelMap[proposal.status]}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Service</p>
                    <p className="mt-1 text-sm font-semibold text-[#191c1e]">{proposal.serviceName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Proposal ID</p>
                    <p className="mt-1 text-sm font-semibold text-[#191c1e]">#{proposal.id}</p>
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
                    <p className="mt-1 text-sm font-semibold text-[#191c1e]">{formatCurrency(proposal.proposalFee)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Discount</p>
                    <p className="mt-1 text-sm font-semibold text-[#ba1a1a]">{formatCurrency(proposal.discountAmount)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Net fee</p>
                    <p className="mt-1 text-sm font-bold text-[#004b31]">
                      {formatCurrency(proposal.proposalFee - proposal.discountAmount)}
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
                      <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">
                        {proposal.payerParty === 'PARTNER' ? 'Partner' : proposal.payerParty === 'CLIENT' ? 'Client' : '-'}
                      </p>
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
                {proposal.document ? (
                  canViewLeadWorkspace && documentUrl ? (
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
                            Uploaded at {formatDateTime(proposal.document.createdAt)}
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
                    <p className="text-sm font-semibold text-[#191c1e]">{proposal.document.documentName}</p>
                  )
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
                    <p className="mt-0.5 text-xs text-[#737784]">{formatDateTime(proposal.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#737784]">Submitted by</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{proposal.submittedByName || '-'}</p>
                    <p className="mt-0.5 text-xs text-[#737784]">{formatDateTime(proposal.submittedAt)}</p>
                  </div>
                </div>
              </section>

              {isNeedRevision ? (
                <section className="p-5">
                  <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-orange-900">Catatan revisi CEO</h4>
                  <p className="whitespace-pre-wrap rounded-lg border border-orange-200 bg-orange-50/80 p-3 text-sm font-medium text-[#7c2d12]">
                    {revisionNote || '-'}
                  </p>
                </section>
              ) : null}
            </div>

            {showManageActions ? (
              <div className="border-t border-[#eceef0] px-5 py-4">
                <div className="flex flex-wrap justify-end gap-2">
                  {isDraft ? (
                    <button
                      type="button"
                      onClick={onDeleteDraft}
                      disabled={deleteBusy}
                      className="rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60 sm:text-sm"
                    >
                      Delete Draft
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onEditProposal}
                    className="rounded-lg bg-[#003c90] px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 sm:text-sm"
                  >
                    Edit Proposal
                  </button>
                </div>
              </div>
            ) : null}

            {showSendToClientAction || showMarkRespondedAction ? (
              <div className="border-t border-[#eceef0] px-5 py-4">
                <div className="flex flex-wrap justify-end gap-2">
                  {showSendToClientAction ? (
                    <button
                      type="button"
                      disabled={lifecycleActionsDisabled}
                      onClick={onSendToClient}
                      className="rounded-lg bg-[#003c90] px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60 sm:text-sm"
                    >
                      Sent to Client
                    </button>
                  ) : null}
                  {showMarkRespondedAction ? (
                    <button
                      type="button"
                      disabled={lifecycleActionsDisabled}
                      onClick={onMarkResponded}
                      className="rounded-lg bg-[#003c90] px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60 sm:text-sm"
                    >
                      Mark as Responded
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
            <p className="max-w-sm text-sm text-[#515f74]">
              Belum ada proposal untuk lead ini. Buat proposal setelah meeting dan notulensi tersedia sesuai alur tim.
            </p>
            {canManageLeadWorkspace ? (
              <button
                type="button"
                onClick={onCreateProposal ?? onEditProposal}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#003c90]/20 transition-opacity hover:opacity-90 sm:text-sm"
              >
                Create Proposal
              </button>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
};
