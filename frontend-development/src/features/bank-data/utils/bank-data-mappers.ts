import type {
  ApiBankDataDetailRow,
  ApiBankDataExtraAnswerRow,
  ApiBankDataListRow
} from '../services/bank-data-api';
import type { BankDataEntry, BankDataExtraAnswer, BankDataSource, BankDataStatus } from '../types/bank-data.types';

const mapStatus = (status: ApiBankDataListRow['bank_data_status']): BankDataStatus => {
  switch (status) {
    case 'PROCESSED':
      return 'Processed';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return 'New';
  }
};

const mapSource = (label: string): BankDataSource => {
  const normalized = label.trim().toLowerCase();
  if (normalized === 'primary') return 'Primary';
  if (normalized === 'instagram') return 'Instagram';
  if (normalized === 'linkedin') return 'LinkedIn';
  if (normalized === 'tiktok') return 'TikTok';
  if (normalized === 'website') return 'Website';
  return 'Primary';
};

const mapExtraAnswer = (row: ApiBankDataExtraAnswerRow): BankDataExtraAnswer => ({
  fieldId: row.field_id,
  label: row.label,
  fieldType: row.field_type,
  displayValue: row.answer_display_value ?? row.answer_value,
  filePath: row.answer_file_path
});

export const mapBankDataListRow = (row: ApiBankDataListRow): BankDataEntry => ({
  id: String(row.lead_id),
  submittedAt: row.submitted_at,
  companyName: row.company_name,
  contactName: row.contact_name,
  contactEmail: row.contact_email,
  contactPhone: row.contact_phone,
  source: mapSource(row.source_label),
  campaignName: row.campaign_name ?? '—',
  formName: row.form_title ?? '—',
  status: mapStatus(row.bank_data_status),
  handledBy: row.handled_by_name,
  handledAt: row.handled_at
});

export const mapBankDataDetailRow = (row: ApiBankDataDetailRow): BankDataEntry => ({
  ...mapBankDataListRow(row),
  companyAddress: row.company_address ?? undefined,
  desiredServices: row.desired_services,
  extraAnswers: (row.extra_answers ?? []).map(mapExtraAnswer)
});
