import type {
  EngagementIssuerCompany,
  EngagementLetterWorkflowStatus,
  EngagementPaymentMethod,
  EngagementTerminType,
  LeadWorkspaceEngagementLetterItem,
  LeadWorkspaceEngagementLetterProposalSummary,
  LeadWorkspaceEngagementLinkedProposalStatus,
  LeadWorkspaceEngagementLetterTerminRow
} from '../types/lead-engagement-letters.types';
import type { ApiEngagementWorkspaceItem } from '../services/lead-workspace-engagements-api';
import { normalizeDateOnlyString } from '../../../utils/format-date-only';

const formatIdr = (n: number | null | undefined): string => {
  if (n == null || Number.isNaN(Number(n))) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n));
};

const formatBytes = (bytes: number | null | undefined): string | undefined => {
  if (bytes == null || bytes < 0 || Number.isNaN(bytes)) return undefined;
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const WORKFLOW_STATUSES: EngagementLetterWorkflowStatus[] = [
  'DRAFT',
  'WAITING_CEO_APPROVAL',
  'NEED_REVISION',
  'APPROVED',
  'SENT',
  'SIGNED',
  'REPLACED'
];

const parseEngagementStatus = (raw: string): EngagementLetterWorkflowStatus => {
  const s = raw as EngagementLetterWorkflowStatus;
  return WORKFLOW_STATUSES.includes(s) ? s : 'DRAFT';
};

const PROPOSAL_STATUSES: LeadWorkspaceEngagementLinkedProposalStatus[] = [
  'DRAFT',
  'WAITING_CEO_APPROVAL',
  'NEED_REVISION',
  'APPROVED',
  'SENT',
  'RESPONDED'
];

const parseProposalStatus = (raw: string): LeadWorkspaceEngagementLinkedProposalStatus | null => {
  const s = raw as LeadWorkspaceEngagementLinkedProposalStatus;
  return PROPOSAL_STATUSES.includes(s) ? s : null;
};

const parseIssuer = (raw: string | null | undefined): EngagementIssuerCompany | string | null => {
  if (raw === 'DSK' || raw === 'DTAX') return raw;
  return raw ?? null;
};

const mapProposalSummary = (ps: ApiEngagementWorkspaceItem['proposal_summary']): LeadWorkspaceEngagementLetterProposalSummary => ({
  proposalId: String(ps.proposal_id),
  proposalCode: ps.proposal_code?.trim() ? ps.proposal_code.trim() : null,
  serviceClassName: ps.service_class_name,
  serviceName: ps.service_name,
  proposalFee: formatIdr(ps.proposal_fee),
  discountAmount: formatIdr(ps.discount_amount),
  finalProposalValue: formatIdr(ps.final_proposal_value),
  proposalStatus: parseProposalStatus(ps.proposal_status),
  proposalIssuerCompany: parseIssuer(ps.proposal_issuer_company),
  latestProposalDocumentName: ps.latest_proposal_document_name,
  latestProposalDocumentPath: ps.latest_proposal_document_path
});

const mapTermins = (rows: ApiEngagementWorkspaceItem['termins']): LeadWorkspaceEngagementLetterTerminRow[] =>
  rows.map((t) => ({
    termName: t.term_name,
    termType: t.term_type as EngagementTerminType,
    percentageDisplay:
      t.percentage != null && !Number.isNaN(Number(t.percentage))
        ? `${Number(t.percentage).toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`
        : '-',
    billingScheduleDate: normalizeDateOnlyString(t.billing_schedule_date),
    description: t.description
  }));

export const mapApiEngagementWorkspaceItemToLeadItem = (item: ApiEngagementWorkspaceItem): LeadWorkspaceEngagementLetterItem => {
  const e = item.engagement;
  const doc = item.latest_engagement_document;
  const paymentMethod = e.payment_method as EngagementPaymentMethod;

  return {
    id: String(e.engagement_id),
    engagementId: String(e.engagement_id),
    engagementCode: e.engagement_code?.trim() ? e.engagement_code.trim() : undefined,
    agreedFeeAmount: e.agreed_fee != null ? Number(e.agreed_fee) : undefined,
    elTerminsDraft:
      paymentMethod === 'TERMIN'
        ? item.termins.map((t) => ({
            term_name: t.term_name,
            term_type: t.term_type as EngagementTerminType,
            percentage: t.percentage != null ? Number(t.percentage) : 0,
            billing_schedule_date: normalizeDateOnlyString(t.billing_schedule_date),
            description: t.description,
            sort_order: t.sort_order
          }))
        : undefined,
    elRetainerDraft:
      paymentMethod === 'RETAINER' && item.retainer
        ? {
            contract_start_date: normalizeDateOnlyString(item.retainer.contract_start_date),
            contract_end_date: normalizeDateOnlyString(item.retainer.contract_end_date),
            billing_timing: item.retainer.billing_timing as 'BEGINNING_OF_MONTH' | 'END_OF_MONTH'
          }
        : undefined,
    issuerCompany: e.issuer_company as EngagementIssuerCompany,
    paymentMethod,
    engagementStatus: parseEngagementStatus(e.engagement_status),
    createdAt: e.created_at ?? '',
    agreedFee: formatIdr(e.agreed_fee),
    revisionNote: e.revision_note,
    createdByName: e.created_by_name,
    submittedByName: e.submitted_by_name,
    submittedAt: e.submitted_at,
    approvedByName: e.approved_by_name,
    approvedAt: e.approved_at,
    sentToClientAt: e.sent_to_client_at,
    signedAt: e.signed_at,
    proposalSummary: mapProposalSummary(item.proposal_summary),
    termins: paymentMethod === 'TERMIN' ? mapTermins(item.termins) : [],
    retainer:
      paymentMethod === 'RETAINER' && item.retainer
        ? {
            contractStartDate: normalizeDateOnlyString(item.retainer.contract_start_date),
            contractEndDate: normalizeDateOnlyString(item.retainer.contract_end_date),
            billingTiming: item.retainer.billing_timing
          }
        : null,
    document: {
      uploadedFileName: doc?.latest_document_name ?? doc?.latest_document_path?.split('/').pop(),
      uploadedAt: doc?.latest_document_uploaded_at,
      uploadedSize: formatBytes(doc?.latest_document_size_bytes ?? undefined),
      versionNo: doc?.latest_document_version,
      filePath: doc?.latest_document_path ?? null
    }
  };
};
