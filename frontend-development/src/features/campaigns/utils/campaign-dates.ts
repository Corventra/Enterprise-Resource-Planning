import { formatDateOnlyId } from '../../../utils/format-date-only';

const dateTimeOpts: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
};

const locale = 'id-ID';

/** Today's date as YYYY-MM-DD in the user's local timezone. */
export const getLocalTodayIsoDate = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Format DATE-only field (start_date / end_date). */
export const formatCampaignDate = (value: string | null | undefined): string =>
  formatDateOnlyId(value, { empty: '—' });

/** Format datetime ISO (created_at / updated_at). */
export const formatCampaignDateTime = (value: string | null | undefined): string => {
  if (value == null || value === '') return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(locale, dateTimeOpts);
};
