/**
 * DATE-only fields (YYYY-MM-DD): no timezone shift when formatting for display.
 * Do not use `new Date(isoDateString)` on bare dates — UTC midnight shifts in WIB.
 */

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/** Extract YYYY-MM-DD from API/DB string; returns null if invalid. */
export const normalizeDateOnlyString = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const match = trimmed.match(DATE_ONLY_RE);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
};

export const parseDateOnlyParts = (
  value: string | null | undefined
): { y: number; m: number; d: number } | null => {
  const normalized = normalizeDateOnlyString(value);
  if (!normalized) return null;
  const [y, m, d] = normalized.split('-').map(Number);
  if (!Number.isFinite(y) || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const probe = new Date(y, m - 1, d);
  if (probe.getFullYear() !== y || probe.getMonth() !== m - 1 || probe.getDate() !== d) {
    return null;
  }
  return { y, m, d };
};

/** Display date-only in id-ID, e.g. 30 Mei 2026 — calendar components only, no UTC parse. */
export const formatDateOnlyId = (
  value: string | null | undefined,
  options?: { empty?: string }
): string => {
  const empty = options?.empty ?? '-';
  const parts = parseDateOnlyParts(value);
  if (!parts) return empty;
  return new Date(parts.y, parts.m - 1, parts.d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/** Format a DATE-only range for display, e.g. `15 Mei 2026 – 30 Jun 2026`. */
export const formatDateOnlyRangeId = (
  start: string | null | undefined,
  end: string | null | undefined,
  options?: { empty?: string }
): string => {
  const empty = options?.empty ?? '-';
  const startLabel = formatDateOnlyId(start, { empty: '' });
  const endLabel = formatDateOnlyId(end, { empty: '' });
  if (!startLabel && !endLabel) return empty;
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  return startLabel || endLabel;
};
