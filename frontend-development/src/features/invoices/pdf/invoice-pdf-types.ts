export type InvoiceIssuerTaxProfile = 'DSK' | 'DTAX';

export interface InvoicePdfViewModel {
  invoiceNumber: string;
  issueDateLabel: string;
  dueDateLabel: string;
  clientCompanyName: string;
  clientCompanyAddress: string;
  /** One line only, shown in PDF DESCRIPTION column */
  descriptionLine: string;
  /** Gross line amount shown in DESCRIPTION / AMOUNT table */
  lineGrossAmount: number;
  dppAmount: number;
  ppnRatePercent: number;
  ppnAmount: number;
  pph23RatePercent: number;
  pph23Amount: number;
  grossAmount: number;
  netAmount: number;
  issuerTaxProfile: InvoiceIssuerTaxProfile;
}
