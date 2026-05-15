import type { InvoiceDetail, InvoiceInstallment } from '../types/invoice.types';
import { buildCanonicalInvoiceNumber } from './invoice-pdf-number';
import { formatPdfDateId } from './invoice-pdf-formatters';
import { computeInvoiceTermTax } from './invoice-pdf-tax';
import type { InvoicePdfViewModel } from './invoice-pdf-types';

export function buildInvoicePdfViewModel(detail: InvoiceDetail, term: InvoiceInstallment): InvoicePdfViewModel {
  const tax = computeInvoiceTermTax(term.baseAmount, detail.issuerTaxProfile);
  const invoiceNumber = buildCanonicalInvoiceNumber(term, detail.invoice.serviceType, term.issuedDate);

  const descriptionLine =
    term.pdfLineDescription?.trim() ||
    `${term.termName} — ${detail.invoice.serviceType} (${detail.invoice.clientName})`;

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
    issuerTaxProfile: detail.issuerTaxProfile,
  };
}
