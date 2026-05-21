export type DocumentCenterCategory =
  | 'PROPOSAL'
  | 'ENGAGEMENT_LETTER'
  | 'CLIENT_PROVIDED'
  | 'INVOICE_PAYMENT'
  | 'PROJECT';

export type DocumentCenterTag =
  | 'LATEST'
  | 'SIGNED'
  | 'FINAL'
  | 'CLIENT_PROVIDED'
  | 'PAYMENT_PROOF';

export type DocumentCenterListFilters = {
  search: string;
  stage: string;
  handledBy: string;
  hasCategory: DocumentCenterCategory | 'All';
  lastUpdated: 'All' | '7d' | '30d' | '90d';
};

export type DocumentCenterDetailFilters = {
  search: string;
  category: DocumentCenterCategory | 'All';
  fileType: 'All' | 'pdf' | 'doc' | 'image' | 'spreadsheet' | 'other';
  uploadedBy: string;
  dateRange: 'All' | '7d' | '30d' | '90d';
  sort: 'newest' | 'name' | 'size';
};

export interface DocumentCenterListItem {
  leadId: number;
  leadCode: string | null;
  companyName: string;
  currentStage: string;
  handledByName: string | null;
  serviceName: string | null;
  totalDocuments: number;
  lastUpdatedAt: string | null;
  categoryCounts: Record<DocumentCenterCategory, number>;
}

export interface DocumentCenterListSummary {
  totalDocuments: number;
  proposal: number;
  engagementLetter: number;
  clientDocuments: number;
  invoiceProof: number;
  project: number;
}

export interface DocumentCenterFileItem {
  source: 'DOCUMENT' | 'INVOICE_PAYMENT';
  id: string;
  documentId?: number;
  paymentId?: number;
  leadId: number;
  category: DocumentCenterCategory;
  documentName: string;
  fileName: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  fileExtension: string | null;
  versionNo: number;
  isLatest: boolean;
  uploadedByName: string | null;
  uploadedAt: string | null;
  sourceModule: string;
  tags: DocumentCenterTag[];
  termName?: string | null;
}

export interface DocumentCenterLeadHeader {
  leadId: number;
  leadCode: string | null;
  companyName: string;
  address: string;
  desiredServices: string | null;
  serviceName: string | null;
  companyPicName: string;
  companyPicPhone: string;
  companyPicEmail: string;
  leadSource: string;
  handledByName: string | null;
  processedAt: string | null;
  updatedAt: string | null;
  totalDocuments: number;
  lastUpdatedAt: string | null;
}
