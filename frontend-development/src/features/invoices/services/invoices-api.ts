import { apiGet, apiPost, apiPostFormData } from '../../../services/api-client';

export interface ApiInvoiceListRow {
  account_id: number;
  lead_id: number;
  company_name: string | null;
  service_name: string | null;
  contract_value_dpp: number;
  total_bill_net: number;
  next_due_date: string | null;
  status: string;
  progress_summary: string | null;
  payment_progress: number;
  next_action: string;
}

export interface ApiInvoiceDocumentRef {
  document_id: number;
  document_name: string;
  file_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  version_no: number | null;
  uploaded_at: string | null;
}

export interface ApiInvoiceTermRow {
  invoice_id: number;
  invoice_number: string | null;
  term_name: string;
  term_type: string;
  term_order: number;
  percentage: number;
  dpp_amount: number;
  ppn_rate: number;
  ppn_amount: number;
  pph23_rate: number;
  pph23_amount: number;
  gross_amount: number;
  net_amount: number;
  issue_date: string | null;
  due_date: string | null;
  billing_schedule_date: string | null;
  billing_trigger_type: string;
  trigger_reference_value: string | null;
  trigger_confirmed_at: string | null;
  sent_to_client_at: string | null;
  status: string;
  issuer_company: string;
}

export interface ApiInvoiceActivityLogRow {
  invoice_activity_id: number;
  account_id: number;
  invoice_id: number | null;
  activity_type: string;
  title: string;
  description: string | null;
  created_by_name: string | null;
  created_at: string | null;
}

export interface ApiInvoicePaymentRow {
  payment_id: number;
  invoice_id: number;
  transaction_date: string | null;
  amount_received_net: number;
  payment_method: string;
  verified_by_name: string | null;
  verified_at: string | null;
  status: string;
  term_name: string;
  proof_file_name: string | null;
  proof_file_path: string | null;
  created_at: string | null;
}

export interface ApiInvoiceDetailPayload {
  core_detail: {
    account_id: number;
    lead_id: number;
    company_name: string | null;
    company_address: string | null;
    pic_name: string | null;
    pic_phone: string | null;
    pic_email: string | null;
    contract_value_dpp: number;
    payment_method: string;
    engagement_reference: string | null;
    engagement_signed_at: string | null;
    service_name: string | null;
    issuer_company: string;
  };
  summary: {
    total_bill_net: number;
    total_paid_net: number;
    total_outstanding_net: number;
    status: string;
    progress_summary: string | null;
    payment_progress: number;
    next_due_date: string | null;
    next_action: string;
  };
  terms: ApiInvoiceTermRow[];
  payments: ApiInvoicePaymentRow[];
  activity_logs: ApiInvoiceActivityLogRow[];
  related_documents: {
    latest_proposal_document: ApiInvoiceDocumentRef | null;
    latest_engagement_document: ApiInvoiceDocumentRef | null;
  };
}

interface ApiInvoiceListResponse {
  success: boolean;
  data: { items: ApiInvoiceListRow[] };
}

interface ApiInvoiceDetailResponse {
  success: boolean;
  data: ApiInvoiceDetailPayload;
}

export const getInvoices = async (): Promise<ApiInvoiceListRow[]> => {
  const res = await apiGet<ApiInvoiceListResponse>('/invoices');
  return res.data.items;
};

export const getInvoiceById = async (accountId: string): Promise<ApiInvoiceDetailPayload> => {
  const res = await apiGet<ApiInvoiceDetailResponse>(`/invoices/${accountId}`);
  return res.data;
};

interface ApiInvoiceGenerateResponse {
  success: boolean;
  data: ApiInvoiceDetailPayload;
}

export const generateInvoiceTerm = async (invoiceTermId: string): Promise<ApiInvoiceDetailPayload> => {
  const res = await apiPost<ApiInvoiceGenerateResponse>(`/invoices/terms/${invoiceTermId}/generate`, {});
  return res.data;
};

export const markInvoiceTermSent = async (invoiceTermId: string): Promise<ApiInvoiceDetailPayload> => {
  const res = await apiPost<ApiInvoiceGenerateResponse>(`/invoices/terms/${invoiceTermId}/sent`, {});
  return res.data;
};

export const confirmInvoiceTermTrigger = async (
  invoiceTermId: string,
  triggerReferenceValue?: string
): Promise<ApiInvoiceDetailPayload> => {
  const res = await apiPost<ApiInvoiceGenerateResponse>(`/invoices/terms/${invoiceTermId}/confirm-trigger`, {
    trigger_reference_value: triggerReferenceValue ?? 'Project completed'
  });
  return res.data;
};

export const createInvoiceTermPayment = async (
  invoiceTermId: string,
  formData: FormData
): Promise<ApiInvoiceDetailPayload> => {
  const res = await apiPostFormData<ApiInvoiceGenerateResponse>(
    `/invoices/terms/${invoiceTermId}/payments`,
    formData
  );
  return res.data;
};
