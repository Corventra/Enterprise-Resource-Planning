import { Download, FileStack, Info } from 'lucide-react';
import { useOutletContext } from 'react-router';
import { getApiOrigin } from '../../../services/api-client';
import { EngagementDocumentCard } from './engagement-document-card';
import { LEAD_WORKSPACE_READINESS_HINT } from '../constants/lead-workspace-readiness';
import { useLeadWorkspacePermissions } from '../hooks/use-lead-workspace-permissions';
import type { LeadWorkspaceEngagementLetterItem } from '../types/lead-engagement-letters.types';
import type { LeadWorkspaceOutletContext } from '../types/lead-workspace.types';
import { formatDateOnlyId } from '../../../utils/format-date-only';
import {
  engagementStatusClassMap,
  engagementStatusLabelMap,
  paymentMethodLabelMap,
  proposalStatusClassForEl,
  proposalStatusLabelForEl,
  retainerBillingTimingLabelMap,
  terminTypeLabelMap
} from '../utils/engagement-letter-labels';

interface EngagementLetterDetailSectionProps {
  engagementLetter?: LeadWorkspaceEngagementLetterItem | null;
  processedByUserId?: number | null;
  onCreateEngagementLetter?: () => void;
  canCreateEngagementLetter?: boolean;
  mutationBusy?: boolean;
  deleteBusy?: boolean;
  onEditDraft?: () => void;
  onDeleteDraft?: () => void;
  /** Operator lead + APPROVED: buka modal tandai terkirim */
  onOpenSentToClient?: () => void;
  /** Operator lead + SENT: buka modal tandai signed */
  onOpenMarkSigned?: () => void;
}

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const dash = (v?: string | null) => {
  if (v === undefined || v === null) return '-';
  const t = String(v).trim();
  return t === '' ? '-' : t;
};

const formatBillingDateCell = (v: string | null) => formatDateOnlyId(v);

export const EngagementLetterDetailSection = ({
  engagementLetter,
  processedByUserId: processedByUserIdProp,
  onCreateEngagementLetter,
  canCreateEngagementLetter = false,
  mutationBusy = false,
  deleteBusy = false,
  onEditDraft,
  onDeleteDraft,
  onOpenSentToClient,
  onOpenMarkSigned
}: EngagementLetterDetailSectionProps) => {
  const outlet = useOutletContext<LeadWorkspaceOutletContext | undefined>();
  const processedByUserId = processedByUserIdProp ?? outlet?.processedByUserId ?? null;
  const { canApproveEngagementLetter, canManageLeadWorkspace } = useLeadWorkspacePermissions({
    processedByUserId
  });

  if (!engagementLetter) {
    const showCreate = canManageLeadWorkspace && canCreateEngagementLetter && Boolean(onCreateEngagementLetter);
    const showOperatorHint = canManageLeadWorkspace && !canCreateEngagementLetter;
    return (
      <aside className="col-span-12 flex flex-col gap-4 lg:col-span-5">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Engagement detail</h2>
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-[#eceef0]">
          {showOperatorHint ? (
            <p className="max-w-sm text-sm text-[#515f74]">
              {LEAD_WORKSPACE_READINESS_HINT.engagementRequiresProposal}
            </p>
          ) : null}
          {showCreate ? (
            <>
              <p className="max-w-sm text-sm text-[#515f74]">
                {LEAD_WORKSPACE_READINESS_HINT.engagementReadyToCreate}
              </p>
              <button
                type="button"
                onClick={onCreateEngagementLetter}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#003c90]/20 transition-opacity hover:opacity-90 sm:text-sm"
              >
                Create Engagement Letter
              </button>
            </>
          ) : null}
        </div>
      </aside>
    );
  }

  const ps = engagementLetter.proposalSummary;
  const proposalDocUrl =
    ps.latestProposalDocumentPath && ps.latestProposalDocumentPath.startsWith('/')
      ? `${getApiOrigin()}${ps.latestProposalDocumentPath}`
      : ps.latestProposalDocumentPath && ps.latestProposalDocumentPath.startsWith('http')
        ? ps.latestProposalDocumentPath
        : null;
  const elDocUrl =
    engagementLetter.document.filePath && engagementLetter.document.filePath.startsWith('/')
      ? `${getApiOrigin()}${engagementLetter.document.filePath}`
      : engagementLetter.document.filePath && engagementLetter.document.filePath.startsWith('http')
        ? engagementLetter.document.filePath
        : null;

  const isDraft = engagementLetter.engagementStatus === 'DRAFT';
  const isNeedRevision = engagementLetter.engagementStatus === 'NEED_REVISION';
  const showManageActions = canManageLeadWorkspace && (isDraft || isNeedRevision);
  const editLabel = isNeedRevision ? 'Edit & kirim ulang' : 'Edit Engagement Letter';

  const proposalStatus = ps.proposalStatus;
  const proposalBadge =
    proposalStatus && proposalStatusLabelForEl[proposalStatus] ? (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${proposalStatusClassForEl[proposalStatus]}`}>
        {proposalStatusLabelForEl[proposalStatus]}
      </span>
    ) : (
      <span className="text-sm font-semibold text-[#191c1e]">-</span>
    );

  return (
    <aside className="col-span-12 flex flex-col gap-4 lg:col-span-5">
      <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Engagement detail</h2>

      <div className="flex max-h-[min(70vh,720px)] flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-0 overflow-y-auto">
          {/* 1. Header summary */}
          <section className="border-b border-[#eceef0] p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-[#191c1e]">
                <Info className="h-5 w-5 shrink-0 text-[#003c90]" />
                Ringkasan engagement letter
              </h3>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${engagementStatusClassMap[engagementLetter.engagementStatus]}`}
              >
                {engagementStatusLabelMap[engagementLetter.engagementStatus]}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Issuer company</p>
                <p className="mt-1 text-sm font-semibold text-[#191c1e]">{engagementLetter.issuerCompany}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Agreed fee</p>
                <p className="mt-1 text-sm font-bold text-[#004b31]">{dash(engagementLetter.agreedFee)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Payment method</p>
                <p className="mt-1 text-sm font-semibold text-[#191c1e]">
                  {paymentMethodLabelMap[engagementLetter.paymentMethod]}
                </p>
              </div>
              {engagementLetter.engagementId ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Engagement code</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-[#191c1e]">
                    {engagementLetter.engagementCode?.trim()
                      ? engagementLetter.engagementCode
                      : `— (legacy #${engagementLetter.engagementId})`}
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          {/* 2. Proposal related */}
          <section className="border-b border-[#eceef0] p-5">
            <div className="mb-3 flex items-center gap-2">
              <FileStack className="h-4 w-4 text-[#003c90]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#191c1e]">Proposal terkait</h4>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Proposal code</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-[#191c1e]">
                  {ps.proposalCode?.trim()
                    ? ps.proposalCode
                    : ps.proposalId
                      ? `— (legacy #${ps.proposalId})`
                      : '-'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Service class</p>
                <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{dash(ps.serviceClassName)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Service</p>
                <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{dash(ps.serviceName)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Proposal fee</p>
                <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{dash(ps.proposalFee)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Discount</p>
                <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{dash(ps.discountAmount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Final proposal value</p>
                <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{dash(ps.finalProposalValue)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Proposal status</p>
                <div className="mt-1">{proposalBadge}</div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold uppercase text-[#737784]">Issuer company (proposal)</p>
                <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{dash(ps.proposalIssuerCompany)}</p>
              </div>
              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#737784]">Latest proposal document</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{dash(ps.latestProposalDocumentName)}</p>
                </div>
                {proposalDocUrl ? (
                  <a
                    href={proposalDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#c3c6d5] bg-white px-3 py-1.5 text-xs font-bold text-[#003c90] hover:bg-[#f2f4f6]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Buka / unduh
                  </a>
                ) : null}
              </div>
            </div>
          </section>

          {/* 3. Timeline */}
          <section className="border-b border-[#eceef0] p-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#191c1e]">Alur pengajuan & persetujuan</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Created by</p>
                <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{dash(engagementLetter.createdByName)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Created at</p>
                <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{formatDateTime(engagementLetter.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Submitted by</p>
                <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{dash(engagementLetter.submittedByName)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Submitted at</p>
                <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{formatDateTime(engagementLetter.submittedAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Approved by</p>
                <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{dash(engagementLetter.approvedByName)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Approved at</p>
                <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{formatDateTime(engagementLetter.approvedAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Sent to client at</p>
                <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{formatDateTime(engagementLetter.sentToClientAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Signed at</p>
                <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{formatDateTime(engagementLetter.signedAt)}</p>
              </div>
            </div>
          </section>

          {/* 4. Payment detail */}
          {engagementLetter.paymentMethod === 'TERMIN' ? (
            <section className="border-b border-[#eceef0] p-5">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#191c1e]">Payment terms</h4>
              {engagementLetter.termins.length === 0 ? (
                <p className="text-sm text-[#737784]">-</p>
              ) : (
                <div className="overflow-x-auto rounded-lg ring-1 ring-[#eceef0]">
                  <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-[#f2f4f6]/70 text-[10px] font-bold uppercase tracking-wider text-[#737784]">
                        <th className="px-3 py-2">Term name</th>
                        <th className="px-3 py-2">Term type</th>
                        <th className="px-3 py-2">Percentage</th>
                        <th className="px-3 py-2">Billing schedule</th>
                        <th className="px-3 py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {engagementLetter.termins.map((row, idx) => (
                        <tr key={`${row.termName}-${idx}`} className="border-t border-[#eceef0]">
                          <td className="px-3 py-2 font-medium text-[#191c1e]">{dash(row.termName)}</td>
                          <td className="px-3 py-2 text-[#434653]">{terminTypeLabelMap[row.termType]}</td>
                          <td className="px-3 py-2 text-[#434653]">{dash(row.percentageDisplay)}</td>
                          <td className="px-3 py-2 text-[#434653]">{formatBillingDateCell(row.billingScheduleDate)}</td>
                          <td className="px-3 py-2 text-[#434653]">{dash(row.description)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : (
            <section className="border-b border-[#eceef0] p-5">
              <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-[#515f74]">Retainer configuration</h4>
              {engagementLetter.retainer ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#737784]">Contract start</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">
                      {formatDateOnlyId(engagementLetter.retainer.contractStartDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#737784]">Contract end</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">
                      {formatDateOnlyId(engagementLetter.retainer.contractEndDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#737784]">Billing timing</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">
                      {engagementLetter.retainer.billingTiming
                        ? retainerBillingTimingLabelMap[engagementLetter.retainer.billingTiming]
                        : '-'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#737784]">-</p>
              )}
            </section>
          )}

          {/* 5. Document — reuse card; heading disesuaikan di dalam card */}
          <div className="border-b border-[#eceef0] p-5">
            <EngagementDocumentCard
              engagementLetter={engagementLetter}
              sectionTitle="Latest engagement letter document"
              documentActionsUrl={elDocUrl}
              embedded
            />
          </div>

          {/* 6. Revision note */}
          {engagementLetter.engagementStatus === 'NEED_REVISION' ? (
            <section className="p-5">
              <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-orange-900">Catatan revisi CEO</h4>
              <p className="whitespace-pre-wrap rounded-lg border border-orange-200 bg-orange-50/80 p-3 text-sm font-medium text-[#7c2d12]">
                {dash(engagementLetter.revisionNote)}
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
                    disabled={deleteBusy || mutationBusy}
                    className="rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60 sm:text-sm"
                  >
                    Delete Draft
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onEditDraft}
                  disabled={mutationBusy}
                  className="rounded-lg bg-[#003c90] px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60 sm:text-sm"
                >
                  {editLabel}
                </button>
              </div>
            </div>
          ) : null}

            {engagementLetter.engagementStatus === 'APPROVED' && canManageLeadWorkspace && onOpenSentToClient ? (
          <div className="border-t border-[#eceef0] px-5 py-4">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                disabled={mutationBusy}
                onClick={onOpenSentToClient}
                className="rounded-lg bg-[#003c90] px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60 sm:text-sm"
              >
                Sent to Client
              </button>
            </div>
          </div>
        ) : null}

          {engagementLetter.engagementStatus === 'SENT' && canManageLeadWorkspace && onOpenMarkSigned ? (
          <div className="border-t border-[#eceef0] px-5 py-4">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                disabled={mutationBusy}
                onClick={onOpenMarkSigned}
                className="rounded-lg bg-[#003c90] px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60 sm:text-sm"
              >
                Mark as Signed
              </button>
            </div>
          </div>
        ) : null}

          {engagementLetter.engagementStatus === 'WAITING_CEO_APPROVAL' && canApproveEngagementLetter ? (
          <div className="border-t border-[#eceef0] px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/90 px-4 py-3">
              <p className="text-sm font-medium text-amber-950">Engagement letter menunggu persetujuan CEO.</p>
              <button
                type="button"
                className="rounded-lg bg-[#003c90] px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                onClick={() => {
                  /* batch approval menyusul */
                }}
              >
                Approve engagement letter
              </button>
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </aside>
  );
};
