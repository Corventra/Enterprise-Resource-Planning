import type { InvoiceInstallment, InvoiceServiceType } from '../types/invoice.types';

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'] as const;

const SERVICE_CODE: Record<InvoiceServiceType, string> = {
  'Web Dev': 'WD',
  Tax: 'TP',
  Audit: 'AU',
  'App Dev': 'AD',
  Maintenance: 'MN',
  Consulting: 'CO',
  Security: 'SC',
};

export function dateToRomanMonth(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return 'I';
  return ROMAN_MONTHS[d.getMonth()] ?? 'I';
}

export function serviceTypeToInvoiceCode(serviceType: InvoiceServiceType): string {
  return SERVICE_CODE[serviceType] ?? 'WD';
}

/**
 * Target format: INV-004/DSK Global/TP/I/2026
 * - If installment.canonicalInvoiceNumber is set (API), use as-is.
 * - Else: INV-{seq}/DSK Global/{serviceCode}/{romanMonth}/{year}
 *   seq = term `number` zero-padded to 3 digits (001, 002, …).
 */
export function buildCanonicalInvoiceNumber(
  installment: InvoiceInstallment,
  serviceType: InvoiceServiceType,
  issueDateIso: string
): string {
  const trimmed = installment.canonicalInvoiceNumber?.trim();
  if (trimmed) return trimmed;

  const seq = String(installment.number).padStart(3, '0');
  const code = serviceTypeToInvoiceCode(serviceType);
  const roman = dateToRomanMonth(issueDateIso);
  const year = Number.isNaN(new Date(issueDateIso).getTime())
    ? new Date().getFullYear()
    : new Date(issueDateIso).getFullYear();
  return `INV-${seq}/DSK Global/${code}/${roman}/${year}`;
}
