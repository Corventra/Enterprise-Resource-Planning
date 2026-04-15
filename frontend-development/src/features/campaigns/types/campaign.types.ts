export type CampaignType = 'Acquisition' | 'Retention' | 'Awareness';

export type CampaignStatus = 'Draft' | 'Active' | 'Paused' | 'Completed';

export type Channel = 'Email' | 'WhatsApp' | 'Instagram' | 'LinkedIn' | 'Website';

export interface Campaign {
  id: string;
  name: string;
  createdBy: string;
  type: CampaignType;
  status: CampaignStatus;
  channel: Channel;
  topic: string;
  startDate: string;
  endDate: string;
  notes?: string;
  totalSubmissions: number;
  createdAt: string;
  updatedAt: string;
}

export type FormStatus = 'Active' | 'Archived';

export interface Form {
  id: string;
  campaignId: string;
  name: string;
  status: FormStatus;
  publishedAt: string;
  submissionCount: number;
}

export type SubmissionStatus = 'New' | 'Qualified' | 'Rejected';

export interface Submission {
  id: string;
  campaignId: string;
  formId: string;
  customerName: string;
  email: string;
  phone: string;
  company: string;
  submittedAt: string;
  status: SubmissionStatus;
  answers: Record<string, string>;
}

export interface BankDataEntry {
  id: string;
  campaignId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
}

export interface CampaignFilters {
  search: string;
  type: CampaignType | 'All';
  channel: Channel | 'All';
  status: CampaignStatus | 'All';
}

export interface CampaignPayload {
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  channel: Channel;
  topic: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface CampaignFormErrors {
  name?: string;
  type?: string;
  channel?: string;
  status?: string;
  topic?: string;
  startDate?: string;
  endDate?: string;
}
