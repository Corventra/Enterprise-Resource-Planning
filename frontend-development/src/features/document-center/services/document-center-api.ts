import { apiGet, tokenStorage } from '../../../services/api-client';
import type { DocumentCenterCategory } from '../types/document-center.types';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface ApiDocumentCenterListRow {
  lead_id: number;
  lead_code: string | null;
  company_name: string;
  current_stage: string;
  processed_by_name: string | null;
  service_name: string | null;
  total_documents: number;
  last_updated_at: string | null;
  category_counts: Record<DocumentCenterCategory, number>;
}

export interface ApiDocumentCenterListSummary {
  total_documents: number;
  proposal: number;
  engagement_letter: number;
  client_documents: number;
  invoice_proof: number;
  project: number;
}

export interface ApiDocumentCenterFileRow {
  source: 'DOCUMENT' | 'INVOICE_PAYMENT';
  id: string;
  document_id?: number;
  payment_id?: number;
  lead_id: number;
  category: DocumentCenterCategory;
  document_name: string;
  file_name: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  file_extension: string | null;
  version_no: number;
  is_latest: boolean;
  uploaded_by_name: string | null;
  uploaded_at: string | null;
  source_module: string;
  tags: string[];
  term_name?: string | null;
}

export const getDocumentCenterList = async () => {
  const res = await apiGet<{
    success: boolean;
    data: {
      items: ApiDocumentCenterListRow[];
      summary: ApiDocumentCenterListSummary;
      meta: { scope: string };
    };
  }>('/document-center');
  return res.data;
};

export const getDocumentCenterLeadDetail = async (leadId: number, latestOnly: boolean) => {
  const params = new URLSearchParams();
  if (latestOnly) params.set('latest_only', 'true');
  const qs = params.toString();
  const path = qs ? `/document-center/leads/${leadId}?${qs}` : `/document-center/leads/${leadId}`;
  const res = await apiGet<{
    success: boolean;
    data: {
      lead: {
        lead_id: number;
        lead_code: string | null;
        company_name: string;
        company_address: string;
        pic_name: string;
        email: string;
        phone_number: string;
        desired_services: string | null;
        service_name: string | null;
        lead_source_label: string;
        processed_by_name: string | null;
        processed_at: string | null;
        updated_at: string | null;
        total_documents: number;
        last_updated_at: string | null;
      };
      categories: Record<string, ApiDocumentCenterFileRow[]>;
      category_summary: Record<DocumentCenterCategory, number>;
      meta: { scope: string; latest_only: boolean };
    };
  }>(path);
  return res.data;
};

export const downloadDocumentCenterFile = async (
  source: 'DOCUMENT' | 'INVOICE_PAYMENT',
  id: number,
  suggestedName: string
): Promise<void> => {
  const params = new URLSearchParams({ source, id: String(id) });
  const url = `${BASE}/document-center/download?${params.toString()}`;
  const token = tokenStorage.get();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    let message = 'Gagal mengunduh file.';
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = suggestedName || 'download';
  anchor.click();
  URL.revokeObjectURL(objectUrl);
};
