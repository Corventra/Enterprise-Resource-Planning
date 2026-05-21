import type { DocumentCenterCategory } from '../types/document-center.types';

export const DOCUMENT_CENTER_CATEGORY_ORDER: DocumentCenterCategory[] = [
  'PROPOSAL',
  'ENGAGEMENT_LETTER',
  'CLIENT_PROVIDED',
  'INVOICE_PAYMENT',
  'PROJECT'
];

export const documentCenterCategoryLabel: Record<DocumentCenterCategory, string> = {
  PROPOSAL: 'Proposal',
  ENGAGEMENT_LETTER: 'Engagement Letter',
  CLIENT_PROVIDED: 'Client Provided Documents',
  INVOICE_PAYMENT: 'Invoice Files / Bukti Pembayaran',
  PROJECT: 'Project Documents'
};

export const documentCenterCategoryHint: Record<DocumentCenterCategory, string> = {
  PROPOSAL: 'Diunggah dari Lead Workspace',
  ENGAGEMENT_LETTER: 'Diunggah dari Lead Workspace',
  CLIENT_PROVIDED: 'Diunggah dari Handover',
  INVOICE_PAYMENT: 'Bukti pembayaran dari Invoice',
  PROJECT: 'Dokumen project (segera hadir)'
};

export const documentCenterCategoryFilterOptions: Array<{ value: DocumentCenterCategory | 'All'; label: string }> = [
  { value: 'All', label: 'Semua Kategori' },
  ...DOCUMENT_CENTER_CATEGORY_ORDER.map((value) => ({
    value,
    label: documentCenterCategoryLabel[value]
  }))
];
