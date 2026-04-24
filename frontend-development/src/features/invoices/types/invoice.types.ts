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
