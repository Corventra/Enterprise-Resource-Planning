import type { Role } from '../../../app/permissions';

export type HandoverEngagementStatus = 'Signed' | 'Pending';

export type HandoverDbStatus =
  | 'DRAFT'
  | 'WAITING_CEO_APPROVAL'
  | 'NEED_REVISION'
  | 'APPROVED'
  | 'ROUTED_TO_COO'
  | 'ASSIGNED_TO_PM';

export type HandoverStatus =
  | 'Draft'
  | 'Waiting CEO Approval'
  | 'Revision Needed'
  | 'Approved'
  | 'Routed to COO'
  | 'Assigned to PM';

export const HANDOVER_STATUS_OPTIONS: readonly HandoverStatus[] = [
  'Draft',
  'Waiting CEO Approval',
  'Revision Needed',
  'Approved',
  'Routed to COO',
  'Assigned to PM'
] as const;

const HANDOVER_DB_STATUS_LABEL: Record<HandoverDbStatus, HandoverStatus> = {
  DRAFT: 'Draft',
  WAITING_CEO_APPROVAL: 'Waiting CEO Approval',
  NEED_REVISION: 'Revision Needed',
  APPROVED: 'Approved',
  ROUTED_TO_COO: 'Routed to COO',
  ASSIGNED_TO_PM: 'Assigned to PM'
};

export const mapHandoverDbStatusToLabel = (dbStatus: string): HandoverStatus => {
  const mapped = HANDOVER_DB_STATUS_LABEL[dbStatus as HandoverDbStatus];
  return mapped ?? 'Draft';
};

/**
 * Tailwind class map for status badges. Use in any list/detail surface that
 * shows a `HandoverStatus`. Update here only — components consume this map.
 */
export const handoverStatusStyleMap: Record<HandoverStatus, string> = {
  Draft: 'bg-[#e0e3e5] text-[#434653]',
  'Waiting CEO Approval': 'bg-amber-100 text-[#a16207]',
  'Revision Needed': 'bg-orange-100 text-[#c2410c]',
  Approved: 'bg-[#d5e3fc] text-[#003c90]',
  'Routed to COO': 'bg-violet-100 text-violet-900',
  'Assigned to PM': 'bg-[#4edea3]/30 text-[#004b31]'
};

export interface HandoverItem {
  id: string;
  docCode: string;
  client: string;
  project: string;
  serviceLine: string;
  period: string;
  engagementStatus: HandoverEngagementStatus;
  engagementStatusDate: string;
  status: HandoverStatus;
  dbStatus?: string;
  createdBy: string;
  createdAt: string | null;
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
  serviceLine: string;
  engagementStatus: HandoverEngagementStatus | 'All';
  status: HandoverStatus | 'All';
}

export interface HandoverTimelineItem {
  milestone: string;
  targetDate: string;
  /** ISO date (YYYY-MM-DD) for edit forms and API payload. */
  targetDateIso?: string | null;
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
  notes?: string | null;
}

export interface HandoverChecklistItem {
  label: string;
  status: 'SUCCESS' | 'INFO' | 'WARNING';
  text: string;
  dbStatus?: string;
}

export interface HandoverClientDocumentItem {
  id: string;
  name: string;
  filePath: string;
  downloadUrl: string | null;
  uploadedAt: string;
  /** Local file selected for upload (not yet persisted). */
  pendingFile?: File;
}

export interface HandoverActivityLogEntry {
  id: string;
  activityType: string;
  title: string;
  description: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface HandoverDocumentControl {
  versionControl: string;
  storagePolicy: string;
  confidentialityTier: string;
}

export interface HandoverDetail {
  id: string;
  docCode: string;
  leadId?: string;
  processedBy?: number | null;
  projectTitle?: string;
  companyGroup?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  confidentiality: string;
  /** Display-friendly status label (mirrors `status` for human-readable copy). */
  projectStatus: string;
  /** Authoritative status mirrored from the parent `HandoverItem.status`. */
  status: HandoverStatus;
  dbStatus?: string;
  ceoRevisionNote?: string | null;
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
  clientDocuments: HandoverClientDocumentItem[];
  storageLocation: string;
  outstandingData: string[];
  confidentialNote: string;
  keyRisks: string[];
  communicationProtocol: string[];
  communicationContacts: HandoverContact[];
  teamAssignments: HandoverTeamMember[];
  checklist: HandoverChecklistItem[];
  activityLogs: HandoverActivityLogEntry[];
  signOff: Array<{ name: string; role: string }>;
  documentControl?: HandoverDocumentControl;
}
