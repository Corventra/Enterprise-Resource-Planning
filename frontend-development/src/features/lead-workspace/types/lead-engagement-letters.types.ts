/**
 * Tipe tampilan Engagement Letter di Lead Workspace.
 * Selaras dengan skema DB (engagement_letters, termins, retainers) + ringkasan proposal terkait.
 *
 * Kontrak API detail (target integrasi batch berikutnya):
 * - Bagian A: engagement_id, issuer_company, agreed_fee, payment_method, engagement_status,
 *   revision_note, audit trail (created/submitted/approved/sent/signed), dokumen EL terbaru.
 * - Bagian B: proposal_id, service_class_name, service_name, proposal_fee, discount_amount,
 *   final_proposal_value, proposal_status, proposal_issuer_company, dokumen proposal terbaru.
 * - Bagian C: termins[] jika payment_method = TERMIN; retainer jika RETAINER.
 */

export type EngagementIssuerCompany = 'DSK' | 'DTAX';

export type EngagementPaymentMethod = 'TERMIN' | 'RETAINER';

/** Status workflow EL — selaras ENUM engagement_status di DB (+ REPLACED untuk histori UI). */
export type EngagementLetterWorkflowStatus =
  | 'DRAFT'
  | 'WAITING_CEO_APPROVAL'
  | 'NEED_REVISION'
  | 'APPROVED'
  | 'SENT'
  | 'SIGNED'
  | 'REPLACED';

export type EngagementTerminType = 'DOWN_PAYMENT' | 'INSTALLMENT' | 'FINAL';

export interface LeadWorkspaceEngagementLetterTerminRow {
  termName: string;
  termType: EngagementTerminType;
  /** Nilai tampilan, mis. "30%" atau "30,00%" */
  percentageDisplay: string;
  billingScheduleDate: string | null;
  description: string | null;
}

export interface LeadWorkspaceEngagementLetterRetainerConfig {
  contractStartDate: string | null;
  contractEndDate: string | null;
  billingTiming: 'BEGINNING_OF_MONTH' | 'END_OF_MONTH' | null;
}

/** Kode status proposal (API) untuk badge/label di ringkasan proposal. */
export type LeadWorkspaceEngagementLinkedProposalStatus =
  | 'DRAFT'
  | 'WAITING_CEO_APPROVAL'
  | 'NEED_REVISION'
  | 'APPROVED'
  | 'SENT'
  | 'RESPONDED';

export interface LeadWorkspaceEngagementLetterProposalSummary {
  proposalId: string | null;
  serviceClassName: string | null;
  serviceName: string | null;
  proposalFee: string | null;
  discountAmount: string | null;
  finalProposalValue: string | null;
  proposalStatus: LeadWorkspaceEngagementLinkedProposalStatus | null;
  proposalIssuerCompany: EngagementIssuerCompany | string | null;
  latestProposalDocumentName: string | null;
  latestProposalDocumentPath: string | null;
}

export interface LeadWorkspaceEngagementLetterDocument {
  uploadedFileName?: string;
  uploadedAt?: string;
  uploadedSize?: string;
  thumbnailUrl?: string;
  versionNo?: number;
  /** Path relatif API (mis. `/uploads/...`) untuk unduh — opsional sampai integrasi dokumen. */
  filePath?: string | null;
}

export interface LeadWorkspaceEngagementLetterItem {
  id: string;
  /** ID numerik dari API (opsional sampai integrasi penuh). */
  engagementId?: string;
  /** Nilai numerik agreed_fee untuk form (dari API). */
  agreedFeeAmount?: number;
  /** Snapshot termin untuk form edit (snake_case selaras API). */
  elTerminsDraft?: Array<{
    term_name: string;
    term_type: EngagementTerminType;
    percentage: number;
    billing_schedule_date: string | null;
    description: string | null;
    sort_order: number;
  }>;
  /** Snapshot retainer untuk form edit. */
  elRetainerDraft?: {
    contract_start_date: string | null;
    contract_end_date: string | null;
    billing_timing: 'BEGINNING_OF_MONTH' | 'END_OF_MONTH';
  };
  issuerCompany: EngagementIssuerCompany;
  paymentMethod: EngagementPaymentMethod;
  engagementStatus: EngagementLetterWorkflowStatus;
  createdAt: string;
  agreedFee: string;
  revisionNote?: string | null;
  createdByName?: string | null;
  submittedByName?: string | null;
  submittedAt?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  sentToClientAt?: string | null;
  signedAt?: string | null;
  proposalSummary: LeadWorkspaceEngagementLetterProposalSummary;
  termins: LeadWorkspaceEngagementLetterTerminRow[];
  retainer: LeadWorkspaceEngagementLetterRetainerConfig | null;
  document: LeadWorkspaceEngagementLetterDocument;
}
