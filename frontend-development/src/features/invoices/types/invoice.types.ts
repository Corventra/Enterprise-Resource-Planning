export type InvoiceAccountStatusDb = 'READY_TO_BILL' | 'AWAITING_PAYMENT' | 'OVERDUE' | 'SETTLED';

export type InvoiceDueStatus = 'Safe' | 'Due Soon' | 'Overdue';

export interface InvoiceItem {
  id: string;
  clientName: string;
  serviceName: string;
  contractValue: number;
  estimatedNetReceipt: number;
  nextDueDate: string | null;
  status: string;
  statusDb: InvoiceAccountStatusDb | string;
  progressSummary: string;
  paymentProgress: number;
  nextAction: string;
}

export interface InvoiceFilters {
  search: string;
  status: string;
  dueStatus: InvoiceDueStatus | 'All';
}

export type InvoiceTermStatusDb =
  | 'DRAFT'
  | 'READY_TO_ISSUE'
  | 'ISSUED'
  | 'SENT'
  | 'PAID'
  | 'OVERDUE';

export type InvoicePaymentMethodDb =
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'GIRO'
  | 'CHEQUE'
  | 'OTHER';

export type InvoiceTermTypeDb = 'DOWN_PAYMENT' | 'INSTALLMENT' | 'FINAL' | 'RETAINER';

export type InvoiceBillingTriggerTypeDb =
  | 'IMMEDIATE'
  | 'SCHEDULE_DATE'
  | 'PROJECT_COMPLETION'
  | 'PERIOD_START'
  | 'PERIOD_END';

export interface InvoiceInstallment {
  id: string;
  number: number;
  invoiceNumber: string;
  canonicalInvoiceNumber?: string;
  termName: string;
  termType: InvoiceTermTypeDb | string;
  billingTriggerType: InvoiceBillingTriggerTypeDb | string;
  triggerReferenceValue?: string | null;
  triggerConfirmedAt?: string | null;
  percentage: number;
  taxScheme: string;
  baseAmount: number;
  totalInvoice: number;
  grossAmount: number;
  ppnAmount: number;
  pph23Amount: number;
  settledAmount: number;
  outstandingAmount: number;
  billingScheduleDate: string;
  issuedDate: string;
  dueDate: string;
  sentToClientAt?: string | null;
  status: 'Draft' | 'Ready to Issue' | 'Issued' | 'Sent' | 'Paid' | 'Overdue' | 'Pending';
  statusDb: InvoiceTermStatusDb | string;
  pdfLineDescription?: string;
}

export interface InvoicePaymentHistoryItem {
  id: string;
  invoiceTermId: string;
  transactionDate: string;
  installmentName: string;
  amountReceived: number;
  pph23Amount: number;
  taxScheme: string;
  settledAmount: number;
  method: string;
  verifiedBy: string;
  status: 'Verified' | 'Pending' | 'Rejected';
  proofFileName?: string | null;
  proofFileUrl?: string | null;
  verifiedAt?: string | null;
  createdAt?: string | null;
}

export interface InvoiceTimelineItem {
  id: string;
  title: string;
  description: string;
  type: 'verified' | 'invoice' | 'note';
}

export interface InvoiceActivityLogItem {
  id: string;
  accountId: string;
  invoiceId: string | null;
  activityType: string;
  title: string;
  description: string | null;
  createdByName: string | null;
  createdAt: string | null;
}

export interface InvoiceRelatedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'invoice' | 'tax';
  url?: string;
}

export interface InvoiceClientInfo {
  clientId: string;
  projectName: string;
  picName: string;
  email: string;
  phone: string;
  address: string;
}

export interface InvoiceContractSummary {
  contractValue: number;
  installmentScheme: string;
  paymentMethod: string;
  engagementLetterReference: string;
  engagementLetterDate: string;
}

export interface InvoiceFinancialSummary {
  dppContract: number;
  grossInvoiceTotal: number;
  netPaymentTotal: number;
  totalPaidNet: number;
  outstandingTotal: number;
  paymentProgress: number;
}

export interface InvoiceSubcontractInfo {
  partnerName: string;
  payerParty: string;
}

export interface InvoiceDetail {
  accountId: string;
  leadId: string;
  /** Kode referensi LD-xxx; fallback ke numerik di mapper jika null. */
  leadCode: string;
  issuerCompany: string;
  issuerTaxProfile: 'DSK' | 'DTAX';
  nextAction: string;
  subcontract: InvoiceSubcontractInfo | null;
  invoice: InvoiceItem;
  contractSummary: InvoiceContractSummary;
  financialSummary: InvoiceFinancialSummary;
  clientInfo: InvoiceClientInfo;
  installments: InvoiceInstallment[];
  paymentHistory: InvoicePaymentHistoryItem[];
  activityLogs: InvoiceActivityLogItem[];
  timeline: InvoiceTimelineItem[];
  relatedDocuments: InvoiceRelatedDocument[];
}
