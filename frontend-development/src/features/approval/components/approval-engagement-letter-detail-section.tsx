import { useMemo } from 'react';
import { Download, FileStack, FileText, Info } from 'lucide-react';
import { getApiOrigin } from '../../../services/api-client';
import type { LeadWorkspaceEngagementLetterItem } from '../../lead-workspace/types/lead-engagement-letters.types';
import { formatDateOnlyId } from '../../../utils/format-date-only';
import {
  engagementStatusClassMap,
  engagementStatusLabelMap,
  paymentMethodLabelMap,
  proposalStatusClassForEl,
  proposalStatusLabelForEl,
  retainerBillingTimingLabelMap,
  terminTypeLabelMap
} from '../../lead-workspace/utils/engagement-letter-labels';
import type { ApprovalProposalLeadSummary } from '../types/approval.types';
import { ApprovalLeadCoreSummary } from './approval-lead-core-summary';

interface ApprovalEngagementLetterDetailSectionProps {
  leadSummary: ApprovalProposalLeadSummary | null;
  leadSummaryLoading?: boolean;
  engagementLines: LeadWorkspaceEngagementLetterItem[];
  detailError?: string | null;
  isReadOnly?: boolean;
  actionsDisabled?: boolean;
  onApprove?: () => void;
  onRequestRevision?: () => void;
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

const ElDocumentBlock = ({ letter }: { letter: LeadWorkspaceEngagementLetterItem }) => {
  const hasUploadedDocument = Boolean(letter.document.uploadedFileName);
  const fileName = letter.document.uploadedFileName ?? '-';
  const fileSize = letter.document.uploadedSize ?? '-';
  const versionNo = letter.document.versionNo;
  const elDocUrl =
    letter.document.filePath && letter.document.filePath.startsWith('/')
      ? `${getApiOrigin()}${letter.document.filePath}`
      : letter.document.filePath && letter.document.filePath.startsWith('http')
        ? letter.document.filePath
        : null;

  return (
    <section className="border-b border-[#eceef0] p-5">
      <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#191c1e]">
        <FileText className="h-5 w-5 shrink-0 text-[#003c90]" />
        Latest engagement letter document
      </h3>
      {!hasUploadedDocument ? (
        <p className="text-sm text-[#737784]">-</p>
      ) : (
        <div className="rounded-xl border border-[#c3c6d5]/50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-[#c3c6d5]/70 bg-[#d5e3fc]/20">
              <FileText className="h-8 w-8 text-[#003c90]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#191c1e]">{fileName}</p>
              <p className="mt-1 text-xs text-[#434653]">{fileSize}</p>
              <p className="mt-1 text-[11px] text-[#737784]">
                {versionNo != null ? (
                  <>
                    Version <span className="font-semibold">{versionNo}</span>
                    <span className="mx-1.5 text-[#c3c6d5]">·</span>
                  </>
                ) : null}
                Uploaded at {formatDateTime(letter.document.uploadedAt)}
              </p>
            </div>
            {elDocUrl ? (
              <a
                href={elDocUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#c3c6d5] bg-white px-3 py-2 text-xs font-bold text-[#003c90] hover:bg-[#f2f4f6]"
              >
                <Download className="h-3.5 w-3.5" />
                Buka / unduh
              </a>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
};

export const ApprovalEngagementLetterDetailSection = ({
  leadSummary,
  leadSummaryLoading = false,
  engagementLines,
  detailError = null,
  isReadOnly = false,
  actionsDisabled = false,
  onApprove,
  onRequestRevision
}: ApprovalEngagementLetterDetailSectionProps) => {
  const engagementLetter = useMemo(() => {
    if (engagementLines.length === 0) return null;
    const waiting = engagementLines.find((row) => row.engagementStatus === 'WAITING_CEO_APPROVAL');
    return waiting ?? engagementLines[0] ?? null;
  }, [engagementLines]);

  const showApprovalActions =
    !isReadOnly &&
    engagementLetter?.engagementStatus === 'WAITING_CEO_APPROVAL' &&
    Boolean(onApprove || onRequestRevision);

  if (!engagementLetter) {
    return (
      <aside className="col-span-12 flex flex-col gap-4 lg:col-span-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Engagement letter detail</h2>
        </div>
        <ApprovalLeadCoreSummary summary={leadSummary} isLoading={leadSummaryLoading} />
        {detailError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm ring-1 ring-red-100">
            {detailError}
          </div>
        ) : null}
        <div className="rounded-xl bg-white p-6 text-sm text-[#737784] shadow-sm ring-1 ring-[#eceef0]">
          {leadSummaryLoading ? 'Memuat detail engagement letter…' : 'Belum ada data engagement letter untuk item ini.'}
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
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Engagement letter detail</h2>
      </div>

      <ApprovalLeadCoreSummary summary={leadSummary} isLoading={leadSummaryLoading} />

      <div className="flex max-h-[min(70vh,720px)] flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        <div className="flex-1 space-y-0 overflow-y-auto">
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

          <section className="border-b border-[#eceef0] p-5">
            <div className="mb-3 flex items-center gap-2">
              <FileStack className="h-4 w-4 text-[#003c90]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#191c1e]">Proposal terkait</h4>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#737784]">Proposal code</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-[#191c1e]">{dash(ps.proposalCode)}</p>
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

          <ElDocumentBlock letter={engagementLetter} />

          {engagementLetter.engagementStatus === 'NEED_REVISION' ? (
            <section className="p-5">
              <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-orange-900">Catatan revisi CEO</h4>
              <p className="whitespace-pre-wrap rounded-lg border border-orange-200 bg-orange-50/80 p-3 text-sm font-medium text-[#7c2d12]">
                {dash(engagementLetter.revisionNote)}
              </p>
            </section>
          ) : null}
        </div>

        {showApprovalActions ? (
          <div className="border-t border-[#c3c6d5]/30 px-5 py-4">
            <div className="flex flex-wrap justify-end gap-2">
              {onRequestRevision ? (
                <button
                  type="button"
                  disabled={actionsDisabled}
                  onClick={onRequestRevision}
                  className="rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60 sm:text-sm"
                >
                  Tolak / minta revisi
                </button>
              ) : null}
              {onApprove ? (
                <button
                  type="button"
                  disabled={actionsDisabled}
                  onClick={onApprove}
                  className="rounded-lg bg-[#003c90] px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60 sm:text-sm"
                >
                  Approve engagement letter
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
};
