import type { InvoiceDetail, InvoiceInstallment } from '../types/invoice.types';
import { buildCanonicalInvoiceNumber } from './invoice-pdf-number';
import { formatPdfDateId } from './invoice-pdf-formatters';
import { computeInvoiceTermTax } from './invoice-pdf-tax';
import type { InvoicePdfViewModel } from './invoice-pdf-types';

const hasStoredTaxAmounts = (term: InvoiceInstallment) =>
  term.statusDb === 'ISSUED' ||
  term.statusDb === 'SENT' ||
  term.statusDb === 'PAID' ||
  term.statusDb === 'OVERDUE';

export function buildInvoicePdfViewModel(detail: InvoiceDetail, term: InvoiceInstallment): InvoicePdfViewModel {
  const invoiceNumber = buildCanonicalInvoiceNumber(term, detail.invoice.serviceName, term.issuedDate);

  const descriptionLine =
    term.pdfLineDescription?.trim() ||
    `${term.termName} — ${detail.invoice.serviceName} (${detail.invoice.clientName})`;

  if (hasStoredTaxAmounts(term) && term.canonicalInvoiceNumber) {
    const ppnRatePercent = term.baseAmount > 0 ? Math.round((term.ppnAmount / term.baseAmount) * 100) : 0;
    const pph23RatePercent = term.baseAmount > 0 ? Math.round((term.pph23Amount / term.baseAmount) * 100) : 2;

    return {
      invoiceNumber,
      issueDateLabel: formatPdfDateId(term.issuedDate),
      dueDateLabel: formatPdfDateId(term.dueDate),
      clientCompanyName: detail.invoice.clientName,
      clientCompanyAddress: detail.clientInfo.address,
      descriptionLine,
      lineGrossAmount: term.grossAmount,
      dppAmount: term.baseAmount,
      ppnRatePercent,
      ppnAmount: term.ppnAmount,
      pph23RatePercent,
      pph23Amount: term.pph23Amount,
      grossAmount: term.grossAmount,
      netAmount: term.totalInvoice,
      issuerTaxProfile: detail.issuerTaxProfile
    };
  }

  const tax = computeInvoiceTermTax(term.baseAmount, detail.issuerTaxProfile);

  return {
    invoiceNumber,
    issueDateLabel: formatPdfDateId(term.issuedDate),
    dueDateLabel: formatPdfDateId(term.dueDate),
    clientCompanyName: detail.invoice.clientName,
    clientCompanyAddress: detail.clientInfo.address,
    descriptionLine,
    lineGrossAmount: tax.grossAmount,
    dppAmount: tax.dppAmount,
    ppnRatePercent: tax.ppnRatePercent,
    ppnAmount: tax.ppnAmount,
    pph23RatePercent: tax.pph23RatePercent,
    pph23Amount: tax.pph23Amount,
    grossAmount: tax.grossAmount,
    netAmount: tax.netAmount,
    issuerTaxProfile: detail.issuerTaxProfile
  };
}
