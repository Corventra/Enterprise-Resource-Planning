import type { LeadWorkspaceOutletContext } from '../../lead-workspace/types/lead-workspace.types';

export type ApprovalKind = 'Proposal' | 'EngagementLetter' | 'HandoverMemo';

export type ApprovalTab = 'proposal' | 'engagement-letter' | 'handover';

export const APPROVAL_KIND_LABELS: Record<ApprovalKind, string> = {
  Proposal: 'Proposal',
  EngagementLetter: 'Engagement Letter',
  HandoverMemo: 'Handover Memo'
};

export interface ApprovalItem {
  id: string;
  kind: ApprovalKind;
  sourceId: string;
  docCode?: string;
  client: string;
  title: string;
  serviceLine?: string;
  submittedBy: string;
  submittedAt: string;
  summary?: string;
  detailRoute: string;
  /** Diisi dari API pending EL; antrean bisa fallback ke map legacy bila tidak ada. */
  engagementQueueMeta?: ApprovalEngagementLetterQueueMeta;
}

export interface ApprovalFilters {
  search: string;
  kind: ApprovalKind | 'All';
}

export interface ApprovalSummary {
  totalPending: number;
  proposals: number;
  engagementLetters: number;
  handoverMemos: number;
}

export interface ApprovalProposalLeadSummary {
  companyName: string | null;
  picName: string | null;
  email: string | null;
  phoneNumber: string | null;
  leadSourceLabel: string | null;
  processedByName: string | null;
  processedAt: string | null;
  desiredServices: string | null;
}

/** Meta baris antrean approval EL (satu baris = satu item approval). */
export interface ApprovalEngagementLetterQueueMeta {
  issuerCompany: string;
  paymentMethod: 'TERMIN' | 'RETAINER';
  /** Status EL yang sedang diajukan untuk approval CEO. */
  engagementStatus:
    | 'DRAFT'
    | 'WAITING_CEO_APPROVAL'
    | 'NEED_REVISION'
    | 'APPROVED'
    | 'SENT'
    | 'SIGNED'
    | 'REPLACED';
  agreedFeeDisplay: string;
}

export interface ApprovalOutletContext extends LeadWorkspaceOutletContext {
  pendingItems: ApprovalItem[];
  selectedPendingId: string | null;
  setSelectedPendingId: (id: string) => void;
  queueLoading: boolean;
  isReadOnly: boolean;
  approve: (item: ApprovalItem, note?: string) => Promise<void>;
  requestRevision: (item: ApprovalItem, note?: string) => Promise<void>;
  refreshQueue: () => Promise<void>;
}
