export type BankDataSource = 'Primary' | 'Instagram' | 'LinkedIn' | 'TikTok' | 'Website';

export type BankDataStatus = 'New' | 'Processed' | 'Archived';

export interface BankDataEntry {
  id: string;
  submittedAt: string;
  companyName: string;
  companyAddress?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  source: BankDataSource;
  campaignName: string;
  formName: string;
  status: BankDataStatus;
  handledBy: string | null;
  handledAt: string | null;
  desiredServices?: string | null;
  extraAnswers?: BankDataExtraAnswer[];
}

export interface BankDataExtraAnswer {
  fieldId: number;
  label: string;
  fieldType: string;
  displayValue: string | null;
  filePath: string | null;
}

export interface BankDataFilters {
  search: string;
  source: BankDataSource | 'All';
  status: BankDataStatus | 'All';
}
