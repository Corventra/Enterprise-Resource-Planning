import { Download, FileText, MessageSquareText } from 'lucide-react';
import { useOutletContext } from 'react-router';
import { getApiOrigin } from '../../../services/api-client';
import { useLeadWorkspacePermissions } from '../hooks/use-lead-workspace-permissions';
import type { LeadWorkspaceOutletContext } from '../types/lead-workspace.types';
import type { LeadWorkspaceProposalView } from '../types/lead-proposals.types';

interface ProposalDetailSectionProps {
  proposal: LeadWorkspaceProposalView | null;
  onEditProposal: () => void;
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
  if (Number.isNaN(d.getTime())) return iso;
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
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Proposal Detail</h2>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        {proposal ? (
          <div className="flex flex-1 flex-col">
            <div className="bg-gradient-to-r from-[#f2f4f6] to-[#f2f4f6]/40 p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold leading-tight text-[#191c1e]">{proposal.serviceName}</h3>
                  <p className="mt-1 text-xs text-[#434653]">Proposal ID: #{proposal.id}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClassMap[proposal.status]}`}>
                  {statusLabelMap[proposal.status]}
                </span>
              </div>
              <p className="text-xs text-[#515f74]">
                {proposal.serviceClassName} - {proposal.issuerCompany}
              </p>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              {isNeedRevision ? (
                <section className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-orange-200">
                      <MessageSquareText className="h-4 w-4 text-[#c2410c]" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="mb-2 text-xs font-black uppercase text-[#7c2d12]">
                        Catatan Revisi dari CEO
                      </h4>
                      <p className="whitespace-pre-wrap font-semibold text-sm leading-relaxed text-[#7c2d12]">
                        {revisionNote || '-'}
                      </p>
                    </div>
                  </div>
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
                  <p className="text-sm font-semibold text-[#191c1e]">{formatCurrency(proposal.proposalFee)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#737784]">Discount</p>
                  <p className="text-sm font-semibold text-[#ba1a1a]">{formatCurrency(proposal.discountAmount)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#737784]">Net Fee</p>
                  <p className="text-sm font-semibold text-[#004b31]">
                    {formatCurrency(proposal.proposalFee - proposal.discountAmount)}
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
                      {proposal.payerParty === 'PARTNER' ? 'Partner' : proposal.payerParty === 'CLIENT' ? 'Client' : '-'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[#737784]">Tidak menggunakan sub contract.</p>
                )}
              </section>

              <section>
                <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-[#434653]">Document</h4>
                {proposal.document ? (
                  canViewLeadWorkspace && documentUrl ? (
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
                    <p className="text-sm text-[#737784]">{proposal.document.documentName}</p>
                  )
                ) : (
                  <p className="text-sm text-[#737784]">-</p>
                )}
              </section>

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#737784]">Created By</p>
                  <p className="text-sm font-semibold text-[#191c1e]">{proposal.createdByName || '-'}</p>
                  <p className="text-xs text-[#737784]">{formatDateTime(proposal.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#737784]">Submitted</p>
                  <p className="text-sm font-semibold text-[#191c1e]">{proposal.submittedByName || '-'}</p>
                  <p className="text-xs text-[#737784]">{formatDateTime(proposal.submittedAt)}</p>
                </div>
              </section>
            </div>

            {showManageActions ? (
              <div className="border-t border-[#c3c6d5]/30 px-6 py-4">
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
              <div className="border-t border-[#c3c6d5]/30 px-6 py-4">
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
          <div className="p-6 text-sm text-[#737784]">Belum ada proposal untuk ditampilkan.</div>
        )}
      </div>
    </aside>
  );
};
