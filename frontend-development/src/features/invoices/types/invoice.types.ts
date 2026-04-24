export type InvoiceServiceType = 'Web Dev' | 'Tax' | 'Audit' | 'App Dev' | 'Maintenance' | 'Consulting' | 'Security';

export type InvoicePaymentStatus =
  | 'Draft'
  | 'Ready to Send'
  | 'Sent'
  | 'Partially Paid'
  | 'Pending Verification'
  | 'Paid'
  | 'Overdue'
  | 'Closed';

export type InvoiceDueStatus = 'Safe' | 'Due Soon' | 'Overdue';

export interface InvoiceItem {
  id: string;
  invoiceCode: string;
  projectCode: string;
  clientName: string;
  serviceType: InvoiceServiceType;
  contractValue: number;
  totalInvoice: number;
  settledValue: number;
  outstandingValue: number;
  nextDueDate: string | null;
  paymentStatus: InvoicePaymentStatus;
  paymentProgress: number;
}

export interface InvoiceFilters {
  search: string;
  paymentStatus: InvoicePaymentStatus | 'All';
  dueStatus: InvoiceDueStatus | 'All';
  serviceType: InvoiceServiceType | 'All';
}

export interface InvoiceInstallment {
  id: string;
  number: number;
  invoiceNumber: string;
  termName: string;
  percentage: number;
  taxScheme: string;
  baseAmount: number;
  totalInvoice: number;
  settledAmount: number;
  outstandingAmount: number;
  issuedDate: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface InvoicePaymentHistoryItem {
  id: string;
  transactionDate: string;
  installmentName: string;
  amountReceived: number;
  pph23Amount: number;
  taxScheme: string;
  settledAmount: number;
  method: string;
  verifiedBy: string;
  status: 'Verified' | 'Pending';
}

export interface InvoiceTimelineItem {
  id: string;
  title: string;
  description: string;
  type: 'verified' | 'invoice' | 'note';
}

export interface InvoiceRelatedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'invoice' | 'tax';
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
  engagementLetterReference: string;
  engagementLetterDate: string;
}

export interface InvoiceFinancialSummary {
  dppContract: number;
  grossInvoiceTotal: number;
  netPaymentTotal: number;
  outstandingTotal: number;
  paymentProgress: number;
}

export interface InvoiceDetail {
  invoice: InvoiceItem;
  contractSummary: InvoiceContractSummary;
  financialSummary: InvoiceFinancialSummary;
  clientInfo: InvoiceClientInfo;
  installments: InvoiceInstallment[];
  paymentHistory: InvoicePaymentHistoryItem[];
  timeline: InvoiceTimelineItem[];
  relatedDocuments: InvoiceRelatedDocument[];
  internalNote: string;
  internalNoteUpdatedAt: string;
}
