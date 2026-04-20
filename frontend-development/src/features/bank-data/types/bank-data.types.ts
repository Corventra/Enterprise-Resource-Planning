export type BankDataSource = 'Website' | 'LinkedIn' | 'Instagram' | 'Email' | 'WhatsApp';

export type BankDataStatus = 'New' | 'Processed' | 'Archived';

export interface BankDataEntry {
  id: string;
  submittedAt: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  source: BankDataSource;
  entrySlug: string;
  campaignName: string;
  formName: string;
  status: BankDataStatus;
}

export interface BankDataFilters {
  search: string;
  source: BankDataSource | 'All';
  status: BankDataStatus | 'All';
}
