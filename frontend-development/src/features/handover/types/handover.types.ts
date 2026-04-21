export type HandoverEngagementStatus = 'Signed' | 'Pending';

export type HandoverStatus = 'Draft' | 'Submitted';

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
  projectStatus: string;
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
