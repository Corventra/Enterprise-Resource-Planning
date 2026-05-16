const parseDateOnly = (value: string): Date | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const dateOnly = trimmed.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;
  const [y, m, d] = dateOnly.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatPdfCurrencyIdr = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);

export const formatPdfDateId = (isoDate: string) => {
  const d = parseDateOnly(isoDate);
  if (!d) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
};

export const formatPdfPercentLabel = (rate: number) => `${rate}%`;
