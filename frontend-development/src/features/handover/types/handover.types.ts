import type { Role } from '../../../app/permissions';

export type HandoverEngagementStatus = 'Signed' | 'Pending';

export type HandoverStatus =
  | 'Draft'
  | 'Waiting CEO Approval'
  | 'Revision Needed'
  | 'Approved'
  | 'Assigned to PM'
  | 'In Project'
  | 'Completed';

export const HANDOVER_STATUS_OPTIONS: readonly HandoverStatus[] = [
  'Draft',
  'Waiting CEO Approval',
  'Revision Needed',
  'Approved',
  'Assigned to PM',
  'In Project',
  'Completed'
] as const;

/**
 * Tailwind class map for status badges. Use in any list/detail surface that
 * shows a `HandoverStatus`. Update here only — components consume this map.
 */
export const handoverStatusStyleMap: Record<HandoverStatus, string> = {
  Draft: 'bg-[#e0e3e5] text-[#434653]',
  'Waiting CEO Approval': 'bg-amber-100 text-[#a16207]',
  'Revision Needed': 'bg-orange-100 text-[#c2410c]',
  Approved: 'bg-[#d5e3fc] text-[#003c90]',
  'Assigned to PM': 'bg-[#4edea3]/30 text-[#004b31]',
  'In Project': 'bg-[#006544]/15 text-[#006544]',
  Completed: 'bg-[#006544]/25 text-[#003c2a]'
};

export interface HandoverItem {
  id: string;
  docCode: string;
  client: string;
  project: string;
  serviceLine: 'Transfer Pricing' | 'Tax' | 'Advisory' | 'Audit';
  period: string;
  engagementStatus: HandoverEngagementStatus;
  engagementStatusDate: string;
  status: HandoverStatus;
}

export type HandoverApprovalAction =
  | 'submitted'
  | 'approved'
  | 'revisionRequested'
  | 'pmAssigned'
  | 'consultantAssigned'
  | 'projectStarted'
  | 'completed';

export interface HandoverApprovalTrailEntry {
  action: HandoverApprovalAction;
  actor: string;
  actorRole: Role;
  at: string;
  note?: string;
}

export const HANDOVER_APPROVAL_ACTION_LABELS: Record<HandoverApprovalAction, string> = {
  submitted: 'Submitted for CEO Approval',
  approved: 'Approved by CEO',
  revisionRequested: 'Revision Requested',
  pmAssigned: 'PM Assigned',
  consultantAssigned: 'Consultant Assigned',
  projectStarted: 'Project Started',
  completed: 'Project Completed'
};

export interface HandoverFilters {
  search: string;
  serviceLine: HandoverItem['serviceLine'] | 'All';
  engagementStatus: HandoverEngagementStatus | 'All';
  status: HandoverStatus | 'All';
}

export interface HandoverTimelineItem {
  milestone: string;
  targetDate: string;
  notes: string;
}

export interface HandoverFeeItem {
  item: string;
  amount: string;
  notes: string;
}

export interface HandoverContact {
  role: string;
  name: string;
  contact: string;
  instruction: string;
}

export interface HandoverTeamMember {
  role: string;
  name: string;
  responsibilities: string;
}

export interface HandoverChecklistItem {
  label: string;
  status: 'SUCCESS' | 'INFO' | 'WARNING';
  text: string;
}

export interface HandoverDocumentControl {
  versionControl: string;
  storagePolicy: string;
  confidentialityTier: string;
}

export interface HandoverDetail {
  id: string;
  docCode: string;
  confidentiality: string;
  /** Display-friendly status label (mirrors `status` for human-readable copy). */
  projectStatus: string;
  /** Authoritative status mirrored from the parent `HandoverItem.status`. */
  status: HandoverStatus;
  approvalTrail?: HandoverApprovalTrailEntry[];
  title: string;
  subtitle: string;
  projectInformation: Array<{ label: string; value: string; accent?: 'primary' | 'success' }>;
  backgroundSummary: string;
  scopeIncluded: string[];
  scopeExcluded: string[];
  deliverables: string[];
  timelineMilestones: HandoverTimelineItem[];
  feeItems: HandoverFeeItem[];
  paymentTerms: string;
  clientDocuments: string[];
  storageLocation: string;
  outstandingData: string[];
  confidentialNote: string;
  keyRisks: string[];
  communicationProtocol: string[];
  communicationContacts: HandoverContact[];
  teamAssignments: HandoverTeamMember[];
  checklist: HandoverChecklistItem[];
  signOff: Array<{ name: string; role: string }>;
  documentControl: HandoverDocumentControl;
}
