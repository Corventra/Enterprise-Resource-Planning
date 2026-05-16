/** Field key sistem LEAD_CAPTURE — fallback placeholder & helper untuk UI */
export const LEAD_CAPTURE_SYSTEM_KEYS = [
  'company_name',
  'company_address',
  'contact_name',
  'contact_email',
  'contact_phone'
] as const;

export type LeadCaptureSystemFieldKey = (typeof LEAD_CAPTURE_SYSTEM_KEYS)[number];

export const LEAD_CAPTURE_FIELD_DISPLAY_DEFAULTS: Record<
  LeadCaptureSystemFieldKey,
  { placeholder: string; helpText: string }
> = {
  company_name: {
    placeholder: 'Masukkan nama perusahaan',
    helpText: 'Isi sesuai nama perusahaan atau badan usaha'
  },
  company_address: {
    placeholder: 'Masukkan alamat perusahaan lengkap',
    helpText: 'Cantumkan alamat domisili atau kantor utama'
  },
  contact_name: {
    placeholder: 'Masukkan nama kontak utama',
    helpText: 'PIC yang dapat dihubungi untuk tindak lanjut'
  },
  contact_email: {
    placeholder: 'contoh@perusahaan.com',
    helpText: 'Gunakan email aktif yang dapat dihubungi'
  },
  contact_phone: {
    placeholder: '08xxxxxxxxxx',
    helpText: 'Gunakan nomor aktif WhatsApp atau telepon'
  }
};

export function isLeadCaptureSystemFieldKey(key: string | undefined): key is LeadCaptureSystemFieldKey {
  return key != null && (LEAD_CAPTURE_SYSTEM_KEYS as readonly string[]).includes(key);
}

/** Merge placeholder & help (note) untuk tampilan + builder saat API kosong */
export function mergeLeadCaptureSystemFieldDisplay(
  fieldKey: string | undefined,
  placeholder: string,
  note: string
): { placeholder: string; note: string } {
  if (!isLeadCaptureSystemFieldKey(fieldKey)) {
    return { placeholder, note };
  }
  const d = LEAD_CAPTURE_FIELD_DISPLAY_DEFAULTS[fieldKey];
  return {
    placeholder: placeholder?.trim() ? placeholder : d.placeholder,
    note: note?.trim() ? note : d.helpText
  };
}

/** Fallback placeholder & help_text untuk public form (termasuk data lama NULL di DB). */
export function withPublicFormFieldDisplayDefaults<
  T extends { field_key: string; placeholder: string | null; help_text: string | null }
>(field: T): T {
  const merged = mergeLeadCaptureSystemFieldDisplay(
    field.field_key,
    field.placeholder ?? '',
    field.help_text ?? ''
  );
  return {
    ...field,
    placeholder: merged.placeholder || field.placeholder,
    help_text: merged.note || field.help_text
  };
}

/** Nilai stabil untuk option value dari label (API tetap butuh value) */
export function optionValueFromLabel(label: string, fallbackIndex: number): string {
  const base = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base.length > 0 ? base : `option_${fallbackIndex}`;
}
