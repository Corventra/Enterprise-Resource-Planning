import type {
  ApiDocumentCenterFileRow,
  ApiDocumentCenterListRow,
  ApiDocumentCenterListSummary
} from '../services/document-center-api';
import type {
  DocumentCenterFileItem,
  DocumentCenterLeadHeader,
  DocumentCenterListItem,
  DocumentCenterListSummary,
  DocumentCenterTag
} from '../types/document-center.types';

const TAGS = new Set<DocumentCenterTag>([
  'LATEST',
  'SIGNED',
  'FINAL',
  'CLIENT_PROVIDED',
  'PAYMENT_PROOF'
]);

export const mapListItem = (row: ApiDocumentCenterListRow): DocumentCenterListItem => ({
  leadId: row.lead_id,
  leadCode: row.lead_code,
  companyName: row.company_name,
  currentStage: row.current_stage,
  handledByName: row.processed_by_name,
  serviceName: row.service_name,
  totalDocuments: row.total_documents,
  lastUpdatedAt: row.last_updated_at,
  categoryCounts: row.category_counts
});

export const mapListSummary = (summary: ApiDocumentCenterListSummary): DocumentCenterListSummary => ({
  totalDocuments: summary.total_documents,
  proposal: summary.proposal,
  engagementLetter: summary.engagement_letter,
  clientDocuments: summary.client_documents,
  invoiceProof: summary.invoice_proof,
  project: summary.project
});

export const mapFileItem = (row: ApiDocumentCenterFileRow): DocumentCenterFileItem => ({
  source: row.source,
  id: row.id,
  documentId: row.document_id,
  paymentId: row.payment_id,
  leadId: row.lead_id,
  category: row.category,
  documentName: row.document_name,
  fileName: row.file_name,
  mimeType: row.mime_type,
  fileSizeBytes: row.file_size_bytes,
  fileExtension: row.file_extension,
  versionNo: row.version_no,
  isLatest: row.is_latest,
  uploadedByName: row.uploaded_by_name,
  uploadedAt: row.uploaded_at,
  sourceModule: row.source_module,
  tags: row.tags.filter((t): t is DocumentCenterTag => TAGS.has(t as DocumentCenterTag)),
  termName: row.term_name ?? null
});

export const mapLeadHeader = (lead: {
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
}): DocumentCenterLeadHeader => ({
  leadId: lead.lead_id,
  leadCode: lead.lead_code,
  companyName: lead.company_name,
  address: lead.company_address,
  desiredServices: lead.desired_services,
  serviceName: lead.service_name,
  companyPicName: lead.pic_name,
  companyPicPhone: lead.phone_number,
  companyPicEmail: lead.email,
  leadSource: lead.lead_source_label,
  handledByName: lead.processed_by_name,
  processedAt: lead.processed_at,
  updatedAt: lead.updated_at,
  totalDocuments: lead.total_documents,
  lastUpdatedAt: lead.last_updated_at
});
