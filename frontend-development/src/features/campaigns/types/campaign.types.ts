/** Status campaign dari backend */
export type CampaignApiStatus = 'ACTIVE' | 'ARCHIVED';

/** Campaign (UI) — dipetakan dari response API */
export interface Campaign {
  id: string;
  campaignCode: string;
  name: string;
  createdBy: string;
  createdById: number;
  campaignTypeId: number;
  campaignTypeName: string;
  campaignTypeCode: string;
  topicId: number;
  topicName: string;
  topicCode: string;
  status: CampaignApiStatus;
  startDate: string;
  endDate: string | null;
  notes?: string | null;
  imagePath: string | null;
  totalSubmissions: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignLookupType {
  campaign_type_id: number;
  name: string;
  code: string;
}

export interface CampaignLookupTopic {
  topic_id: number;
  name: string;
  code: string;
}

/** Nilai form create/edit (tanpa file) */
export interface CampaignFormValues {
  name: string;
  campaignTypeId: number | '';
  topicId: number | '';
  startDate: string;
  endDate: string;
  notes: string;
}

export interface CampaignFormErrors {
  name?: string;
  campaignTypeId?: string;
  topicId?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface CampaignFilters {
  search: string;
  /** Nama tipe campaign dari API atau `All` */
  type: string;
  status: CampaignApiStatus | 'All';
  /** Nama pembuat campaign dari API atau `All` */
  createdBy: string;
}

/** Payload submit dari modal ke hook/service */
export interface CampaignSubmitInput {
  values: CampaignFormValues;
  noEndDate: boolean;
  imageFile: File | null;
}

/** @deprecated Legacy mock UI — tidak dipakai integrasi API */
export type CampaignType = 'Acquisition' | 'Retention' | 'Awareness';

/** @deprecated Legacy mock UI */
export type CampaignStatus = 'Draft' | 'Active' | 'Paused' | 'Completed';

export type Channel = 'Email' | 'WhatsApp' | 'Instagram' | 'LinkedIn' | 'Website';

export type FormStatus = 'Active' | 'Archived' | 'Draft' | 'Inactive';

/** Status API form (untuk badge Dijeda, dll.) */
export type CampaignFormBackendStatus = 'DRAFT' | 'PUBLISHED' | 'INACTIVE';

export interface Form {
  id: string;
  campaignId: string;
  name: string;
  status: FormStatus;
  publishedAt: string;
  submissionCount: number;
  fieldCount?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  /** Kode form dari backend (frm-xxx) */
  formCode?: string;
  shortLinks?: { label: string; url: string }[];
  /** Mirror backend — untuk badge Dijeda vs Published */
  backendFormStatus?: CampaignFormBackendStatus;
  isAcceptingResponses?: boolean;
  formCategory?: 'LEAD_CAPTURE' | 'GENERAL';
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
