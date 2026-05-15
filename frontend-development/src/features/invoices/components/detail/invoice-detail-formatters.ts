/** Parse YYYY-MM-DD as calendar date (no timezone shift). */
const parseDateOnly = (value: string): Date | null => {
  const dateOnly = value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;
  const [y, m, d] = dateOnly.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);

export const formatDate = (value: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return '-';
  const d = parseDateOnly(trimmed);
  if (!d) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
};
