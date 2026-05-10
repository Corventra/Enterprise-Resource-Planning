const dateOnlyOpts: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
};

const dateTimeOpts: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
};

const locale = 'id-ID';

/** Format tanggal calendar (YYYY-MM-DD atau ISO). */
export const formatCampaignDate = (value: string | null | undefined): string => {
  if (value == null || value === '') return '—';
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(locale, dateOnlyOpts);
};

/** Format datetime ISO (created_at / updated_at). */
export const formatCampaignDateTime = (value: string | null | undefined): string => {
  if (value == null || value === '') return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(locale, dateTimeOpts);
};
