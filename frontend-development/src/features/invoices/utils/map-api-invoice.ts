import { getApiOrigin } from '../../../services/api-client';
import { formatLeadDisplayId } from '../../lead-workspace/utils/format-lead-display-id';
import type {
  ApiInvoiceDetailPayload,
  ApiInvoiceListRow,
  ApiInvoicePaymentRow,
  ApiInvoiceTermRow
} from '../services/invoices-api';
import type {
  InvoiceDetail,
  InvoiceInstallment,
  InvoiceItem,
  InvoiceActivityLogItem,
  InvoicePaymentHistoryItem,
  InvoiceRelatedDocument
} from '../types/invoice.types';
import type { ApiInvoiceActivityLogRow } from '../services/invoices-api';

const dash = (v?: string | null) => {
  if (v === undefined || v === null) return '-';
  const t = String(v).trim();
  return t === '' ? '-' : t;
};

const mapAccountStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    READY_TO_BILL: 'Ready to Bill',
    AWAITING_PAYMENT: 'Awaiting Payment',
    OVERDUE: 'Overdue',
    SETTLED: 'Settled'
  };
  return labels[status] ?? status;
};

const mapTermStatusLabel = (status: string): InvoiceInstallment['status'] => {
  const labels: Record<string, InvoiceInstallment['status']> = {
    DRAFT: 'Draft',
    READY_TO_ISSUE: 'Ready to Issue',
    ISSUED: 'Issued',
    SENT: 'Sent',
    PAID: 'Paid',
    OVERDUE: 'Overdue'
  };
  return labels[status] ?? 'Pending';
};

const formatTaxScheme = (issuerCompany: string): string => {
  if (issuerCompany === 'DSK') return 'PPh23 2%';
  if (issuerCompany === 'DTAX') return 'PPN 11% + PPh23 2%';
  return '-';
};

const mapPaymentMethodLabel = (method: string): string => {
  if (method === 'TERMIN') return 'Termin';
  if (method === 'RETAINER') return 'Retainer';
  return method;
};

const mapPaymentHistoryStatus = (status: string): InvoicePaymentHistoryItem['status'] => {
  if (status === 'VERIFIED') return 'Verified';
  if (status === 'REJECTED') return 'Rejected';
  return 'Pending';
};

const mapPaymentMethodHistory = (method: string): string => {
  const labels: Record<string, string> = {
    BANK_TRANSFER: 'Bank Transfer',
    CASH: 'Cash',
    GIRO: 'Giro',
    CHEQUE: 'Cheque',
    OTHER: 'Other'
  };
  return labels[method] ?? method;
};

const buildDocumentUrl = (filePath: string) => {
  const origin = getApiOrigin();
  const path = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${origin}${path}`;
};

const mapRelatedDocument = (
  doc: { document_id: number; document_name: string; file_path: string } | null,
  fallbackName: string
): InvoiceRelatedDocument | null => {
  if (!doc?.file_path) return null;
  return {
    id: String(doc.document_id),
    name: dash(doc.document_name) === '-' ? fallbackName : doc.document_name,
    type: 'pdf',
    url: buildDocumentUrl(doc.file_path)
  };
};

const mapTermToInstallment = (term: ApiInvoiceTermRow): InvoiceInstallment => ({
  id: String(term.invoice_id),
  number: term.term_order,
  invoiceNumber: dash(term.invoice_number),
  canonicalInvoiceNumber: term.invoice_number ?? undefined,
  termName: term.term_name,
  termType: term.term_type,
  billingTriggerType: term.billing_trigger_type,
  triggerReferenceValue: term.trigger_reference_value ?? null,
  triggerConfirmedAt: term.trigger_confirmed_at ?? null,
  percentage: term.percentage,
  taxScheme: formatTaxScheme(term.issuer_company),
  baseAmount: term.dpp_amount,
  totalInvoice: term.net_amount,
  grossAmount: term.gross_amount,
  ppnAmount: term.ppn_amount,
  pph23Amount: term.pph23_amount,
  settledAmount: term.status === 'PAID' ? term.net_amount : 0,
  outstandingAmount: term.status === 'PAID' ? 0 : term.net_amount,
  billingScheduleDate: term.billing_schedule_date ?? '',
  issuedDate: term.issue_date ?? '',
  dueDate: term.due_date ?? '',
  sentToClientAt: term.sent_to_client_at ?? null,
  status: mapTermStatusLabel(term.status),
  statusDb: term.status
});

const mapActivityLogRow = (row: ApiInvoiceActivityLogRow): InvoiceActivityLogItem => ({
  id: String(row.invoice_activity_id),
  accountId: String(row.account_id),
  invoiceId: row.invoice_id != null ? String(row.invoice_id) : null,
  activityType: row.activity_type,
  title: row.title,
  description: row.description ?? null,
  createdByName: row.created_by_name ?? null,
  createdAt: row.created_at ?? null
});

const mapPaymentRow = (row: ApiInvoicePaymentRow, issuerCompany: string): InvoicePaymentHistoryItem => ({
  id: String(row.payment_id),
  invoiceTermId: String(row.invoice_id),
  transactionDate: row.transaction_date ?? '',
  installmentName: row.term_name,
  amountReceived: row.amount_received_net,
  pph23Amount: 0,
  taxScheme: formatTaxScheme(issuerCompany),
  settledAmount: row.amount_received_net,
  method: mapPaymentMethodHistory(row.payment_method),
  verifiedBy: dash(row.verified_by_name),
  status: mapPaymentHistoryStatus(row.status),
  proofFileName: row.proof_file_name ?? null,
  proofFileUrl: row.proof_file_path ? buildDocumentUrl(row.proof_file_path) : null,
  verifiedAt: row.verified_at ?? null,
  createdAt: row.created_at ?? null
});

export const mapApiInvoiceListRowToItem = (row: ApiInvoiceListRow): InvoiceItem => ({
  id: String(row.account_id),
  clientName: dash(row.company_name),
  serviceName: dash(row.service_name),
  contractValue: row.contract_value_dpp,
  estimatedNetReceipt: row.total_bill_net,
  nextDueDate: row.next_due_date,
  status: mapAccountStatusLabel(row.status),
  statusDb: row.status,
  progressSummary: dash(row.progress_summary),
  paymentProgress: row.payment_progress,
  nextAction: row.next_action
});

export const mapApiInvoiceDetailToDetail = (payload: ApiInvoiceDetailPayload): InvoiceDetail => {
  const { core_detail: core, summary } = payload;
  const issuerTaxProfile = core.issuer_company === 'DTAX' ? 'DTAX' : 'DSK';
  const leadCode =
    core.lead_code && String(core.lead_code).trim() !== '' ? String(core.lead_code).trim() : formatLeadDisplayId(core.lead_id);

  const relatedDocuments = [
    mapRelatedDocument(payload.related_documents.latest_proposal_document, 'Proposal'),
    mapRelatedDocument(payload.related_documents.latest_engagement_document, 'Engagement Letter')
  ].filter((d): d is InvoiceRelatedDocument => d != null);

  return {
    accountId: String(core.account_id),
    leadId: String(core.lead_id),
    leadCode,
    issuerCompany: core.issuer_company,
    issuerTaxProfile,
    subcontract: null,
    nextAction: summary.next_action,
    invoice: {
      id: String(core.account_id),
      clientName: dash(core.company_name),
      serviceName: dash(core.service_name),
      contractValue: core.contract_value_dpp,
      estimatedNetReceipt: summary.total_bill_net,
      nextDueDate: summary.next_due_date,
      status: mapAccountStatusLabel(summary.status),
      statusDb: summary.status,
      progressSummary: dash(summary.progress_summary),
      paymentProgress: summary.payment_progress,
      nextAction: summary.next_action
    },
    contractSummary: {
      contractValue: core.contract_value_dpp,
      installmentScheme: dash(summary.progress_summary),
      paymentMethod: mapPaymentMethodLabel(core.payment_method),
      engagementLetterReference: dash(core.engagement_reference),
      engagementLetterDate: core.engagement_signed_at ?? ''
    },
    financialSummary: {
      dppContract: core.contract_value_dpp,
      grossInvoiceTotal: summary.total_bill_net,
      netPaymentTotal: summary.total_bill_net,
      totalPaidNet: summary.total_paid_net,
      outstandingTotal: summary.total_outstanding_net,
      paymentProgress: summary.payment_progress
    },
    clientInfo: {
      clientId: String(core.lead_id),
      projectName: dash(core.service_name),
      picName: dash(core.pic_name),
      email: dash(core.pic_email),
      phone: dash(core.pic_phone),
      address: dash(core.company_address)
    },
    installments: payload.terms.map(mapTermToInstallment),
    paymentHistory: payload.payments.map((p) => mapPaymentRow(p, core.issuer_company)),
    activityLogs: (payload.activity_logs ?? []).map(mapActivityLogRow),
    timeline: [],
    relatedDocuments
  };
};
