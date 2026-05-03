export type ApprovalKind = 'Proposal' | 'EngagementLetter' | 'HandoverMemo';

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
