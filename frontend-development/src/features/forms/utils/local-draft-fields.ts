import type { FormBuilderField } from '../types/form-builder.types';
import { LEAD_CAPTURE_FIELD_DISPLAY_DEFAULTS } from './lead-capture-field-fallbacks';

/** 5 field wajib LEAD_CAPTURE — sama dengan backend, ditampilkan sebelum save pertama. */
export const getLeadCaptureLocalMandatoryFields = (): FormBuilderField[] => [
  {
    id: 'pre-local-company_name',
    fieldKey: 'company_name',
    type: 'short-text',
    label: 'Nama Perusahaan',
    note: LEAD_CAPTURE_FIELD_DISPLAY_DEFAULTS.company_name.helpText,
    placeholder: LEAD_CAPTURE_FIELD_DISPLAY_DEFAULTS.company_name.placeholder,
    required: true,
    isCore: true,
    isLocked: true,
    isSystem: true,
    isPreSaveLocalSystem: true,
    sortOrder: 1
  },
  {
    id: 'pre-local-company_address',
    fieldKey: 'company_address',
    type: 'long-text',
    label: 'Alamat Perusahaan',
    note: LEAD_CAPTURE_FIELD_DISPLAY_DEFAULTS.company_address.helpText,
    placeholder: LEAD_CAPTURE_FIELD_DISPLAY_DEFAULTS.company_address.placeholder,
    required: true,
    isCore: true,
    isLocked: true,
    isSystem: true,
    isPreSaveLocalSystem: true,
    sortOrder: 2
  },
  {
    id: 'pre-local-contact_name',
    fieldKey: 'contact_name',
    type: 'short-text',
    label: 'Nama Kontak',
    note: LEAD_CAPTURE_FIELD_DISPLAY_DEFAULTS.contact_name.helpText,
    placeholder: LEAD_CAPTURE_FIELD_DISPLAY_DEFAULTS.contact_name.placeholder,
    required: true,
    isCore: true,
    isLocked: true,
    isSystem: true,
    isPreSaveLocalSystem: true,
    sortOrder: 3
  },
  {
    id: 'pre-local-contact_email',
    fieldKey: 'contact_email',
    type: 'short-text',
    label: 'Email',
    note: LEAD_CAPTURE_FIELD_DISPLAY_DEFAULTS.contact_email.helpText,
    placeholder: LEAD_CAPTURE_FIELD_DISPLAY_DEFAULTS.contact_email.placeholder,
    required: true,
    isCore: true,
    isLocked: true,
    isSystem: true,
    isPreSaveLocalSystem: true,
    sortOrder: 4
  },
  {
    id: 'pre-local-contact_phone',
    fieldKey: 'contact_phone',
    type: 'short-text',
    label: 'Nomor',
    note: LEAD_CAPTURE_FIELD_DISPLAY_DEFAULTS.contact_phone.helpText,
    placeholder: LEAD_CAPTURE_FIELD_DISPLAY_DEFAULTS.contact_phone.placeholder,
    required: true,
    isCore: true,
    isLocked: true,
    isSystem: true,
    isPreSaveLocalSystem: true,
    sortOrder: 5
  }
];

/** Satu field default GENERAL — editable, bisa dihapus, bisa di-drag. */
export const getGeneralDefaultLocalField = (): FormBuilderField => ({
  id: `pre-local-general-${Date.now().toString(36)}`,
  fieldKey: 'general_default',
  type: 'short-text',
  label: 'Field teks',
  note: '',
  placeholder: 'Jawaban singkat',
  required: false,
  isCore: false,
  isLocked: false,
  isSystem: false,
  sortOrder: 1
});

export const getInitialFieldsForCategory = (cat: 'LEAD_CAPTURE' | 'GENERAL'): FormBuilderField[] =>
  cat === 'LEAD_CAPTURE' ? getLeadCaptureLocalMandatoryFields() : [getGeneralDefaultLocalField()];

/** Field yang tidak ikut urut drag (sistem wajib). */
export const isFieldPinnedForDnD = (f: FormBuilderField): boolean =>
  Boolean(f.isPreSaveLocalSystem) || (Boolean(f.isLocked) && Boolean(f.isSystem) && Boolean(f.backendFieldId));
