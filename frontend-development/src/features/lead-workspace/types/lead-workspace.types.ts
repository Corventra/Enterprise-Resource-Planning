export type WorkspaceTab = 'meeting' | 'proposal' | 'engagement-letter';

export interface LeadWorkspaceMeetingItem {
  id: string;
  title: string;
  mode: 'Zoom' | 'Google Meet' | 'Onsite';
  platformOrLocation: string;
  date: string;
  duration: string;
  status: 'Done' | 'Scheduled';
  notes: string;
  minutesSummary: string;
  minutesDetail: LeadWorkspaceMeetingMinutesDetail;
}

export interface LeadWorkspaceMeetingMinutesDetail {
  participants: {
    internal: string[];
    client: string[];
  };
  objectives: string;
  discussionSummary: {
    background: string;
    issuesDiscussed: string;
    clientInfo: string;
    firmInfo: string;
    risks: string;
  };
  agreements: Array<{
    item: string;
    details: string;
  }>;
  actionItems: Array<{
    action: string;
    pic: string;
    deadline: string;
  }>;
  nextSteps: string;
  followUpNotes: string;
}

export interface LeadWorkspaceMinutesItem {
  id: string;
  title: string;
  createdAt: string;
  createdBy: string;
  status: 'Draft' | 'Submitted' | 'Revision Needed';
  summary: string;
}

export interface LeadWorkspaceProposal {
  title: string;
  serviceType: string;
  estimatedFee: string;
  paymentTerms: string;
  status: 'Drafting' | 'Submitted for Approval' | 'Approved' | 'Sent to Client' | 'Client Reviewing';
}

export interface LeadWorkspaceProposalItem {
  id: string;
  title: string;
  createdAt: string;
  paymentType: string;
  subcon: string;
  sentAt: string;
  dealDate: string;
  proposalFee: string;
  dealPrice: string;
  notes: string;
  detail: LeadWorkspaceProposalDetail;
}

export interface LeadWorkspaceProposalDetail {
  tier: 'STRATEGIC_RETAINER' | 'PREMIUM_MODULAR' | 'STANDARDIZED_MODULAR';
  serviceType: string;
  status: 'DRAFT' | 'WAITING_CEO_APPROVAL' | 'REVISION' | 'APPROVED' | 'SENT';
  discount: string;
  agreeFee: string;
  hasSubcon: boolean;
  subconPartner: string;
  subconPayer: 'PARTNER' | 'CLIENT' | '';
  planMode: 'INSTALLMENTS' | 'MONTHLY_RETAINER' | 'DISPUTE_UM_SF';
  billingSchedule: Array<{
    label: string;
    percentage: number;
    nominal: string;
    description: string;
  }>;
  contractStart: string;
  contractEnd: string;
  billingTiming: 'START_OF_MONTH' | 'END_OF_MONTH';
  downPayment: string;
  successFeePercent: string;
  successFeeBase: string;
  attachments: string[];
}

export interface LeadWorkspaceEngagementLetter {
  status: 'Not Created' | 'Drafting' | 'Submitted for Approval' | 'Approved' | 'Sent to Client' | 'Awaiting Signature' | 'Signed';
  lastUpdatedAt: string;
  owner: string;
  notes: string;
}

export interface LeadWorkspaceEngagementLetterItem {
  id: string;
  title: string;
  serviceName: string;
  createdAt: string;
  agreeFee: string;
  paymentTypeFinal: string;
  hasSubcon: boolean;
  signedAt?: string;
  status: 'DRAFT' | 'PENDING' | 'SENT' | 'AWAITING_SIGNATURE' | 'SIGNED' | 'REPLACED';
  document: {
    uploadedFileName?: string;
    uploadedAt?: string;
    uploadedSize?: string;
    thumbnailUrl?: string;
  };
}

export interface LeadWorkspaceNextStep {
  id: string;
  title: string;
  description: string;
  isDone: boolean;
  assignee: string;
}

export interface LeadWorkspace {
  id: string;
  leadCode: string;
  companyName: string;
  address: string;
  industry: string;
  companyPicName: string;
  companyPicRole: string;
  companyPicPhone: string;
  companyPicEmail: string;
  leadSource: string;
  processedAt: string;
  processedBy: string;
  currentStage: string;
  archiveLabel: string;
  minutesHighlight: string;
  meetings: LeadWorkspaceMeetingItem[];
  minutes: LeadWorkspaceMinutesItem[];
  proposal: LeadWorkspaceProposal;
  proposals: LeadWorkspaceProposalItem[];
  engagementLetter: LeadWorkspaceEngagementLetter;
  engagementLetters: LeadWorkspaceEngagementLetterItem[];
  nextSteps: LeadWorkspaceNextStep[];
  winProbability: number;
}
