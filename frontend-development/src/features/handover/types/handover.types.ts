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
