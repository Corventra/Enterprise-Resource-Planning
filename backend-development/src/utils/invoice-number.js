/**
 * Invoice number format: INV-{seq}/DSK Global/{serviceCode}/{romanMonth}/{year}
 * Example: INV-004/DSK Global/TP/I/2026
 *
 * Sequence: global per calendar year (MAX invoice_sequence_no + 1), allocated inside a transaction.
 */

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const INVOICE_COMPANY_LABEL = 'DSK Global';

const dateToRomanMonth = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return 'I';
  return ROMAN_MONTHS[d.getMonth()] ?? 'I';
};

/**
 * Short service code for invoice number (aligned with PDF / business examples).
 * Prefers services.code when mapped; falls back to service name heuristics.
 */
const serviceCodeForInvoiceNumber = (serviceDbCode, serviceName) => {
  const code = String(serviceDbCode ?? '').trim().toUpperCase();
  if (code.startsWith('TP') || code.includes('TAX')) return 'TP';
  if (code.startsWith('AU') || code.includes('AUDIT')) return 'AU';
  if (code.includes('WEB') || code === 'WEBSITE_COMPANY_PROFILE_BASIC') return 'WD';
  if (code.includes('APP')) return 'AD';
  if (code.includes('MAINT')) return 'MN';
  if (code.includes('CONSULT')) return 'CO';
  if (code.includes('SECUR')) return 'SC';

  const name = String(serviceName ?? '').trim().toLowerCase();
  if (name.includes('tax')) return 'TP';
  if (name.includes('audit')) return 'AU';
  if (name.includes('app')) return 'AD';
  if (name.includes('maint')) return 'MN';
  if (name.includes('consult')) return 'CO';
  if (name.includes('secur')) return 'SC';
  if (name.includes('web')) return 'WD';
  return 'WD';
};

const buildInvoiceNumber = ({ sequenceNo, serviceDbCode, serviceName, issueDate }) => {
  const seq = String(sequenceNo).padStart(3, '0');
  const serviceCode = serviceCodeForInvoiceNumber(serviceDbCode, serviceName);
  const d = issueDate instanceof Date ? issueDate : new Date(issueDate);
  const roman = dateToRomanMonth(d);
  const year = d.getFullYear();
  return `INV-${seq}/${INVOICE_COMPANY_LABEL}/${serviceCode}/${roman}/${year}`;
};

module.exports = {
  INVOICE_COMPANY_LABEL,
  dateToRomanMonth,
  serviceCodeForInvoiceNumber,
  buildInvoiceNumber
};
