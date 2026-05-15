import type { InvoiceInstallment } from '../types/invoice.types';

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'] as const;

const parseDateOnly = (value: string): Date | null => {
  const dateOnly = value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;
  const [y, m, d] = dateOnly.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export function dateToRomanMonth(isoDate: string): string {
  const d = parseDateOnly(isoDate) ?? new Date();
  if (Number.isNaN(d.getTime())) return 'I';
  return ROMAN_MONTHS[d.getMonth()] ?? 'I';
}

export function serviceNameToInvoiceCode(serviceName: string): string {
  const normalized = serviceName.trim().toLowerCase();
  if (normalized.includes('tax')) return 'TP';
  if (normalized.includes('audit')) return 'AU';
  if (normalized.includes('app')) return 'AD';
  if (normalized.includes('maint')) return 'MN';
  if (normalized.includes('consult')) return 'CO';
  if (normalized.includes('secur')) return 'SC';
  if (normalized.includes('web')) return 'WD';
  return 'WD';
}

/**
 * Target format: INV-004/DSK Global/TP/I/2026
 * - If installment.canonicalInvoiceNumber is set (API), use as-is.
 * - Else: INV-{seq}/DSK Global/{serviceCode}/{romanMonth}/{year}
 */
export function buildCanonicalInvoiceNumber(
  installment: InvoiceInstallment,
  serviceName: string,
  issueDateIso: string
): string {
  const trimmed = installment.canonicalInvoiceNumber?.trim();
  if (trimmed) return trimmed;

  const seq = String(installment.number).padStart(3, '0');
  const code = serviceNameToInvoiceCode(serviceName);
  const issueParsed = parseDateOnly(issueDateIso);
  const roman = dateToRomanMonth(issueDateIso);
  const year = issueParsed?.getFullYear() ?? new Date().getFullYear();
  return `INV-${seq}/DSK Global/${code}/${roman}/${year}`;
}
