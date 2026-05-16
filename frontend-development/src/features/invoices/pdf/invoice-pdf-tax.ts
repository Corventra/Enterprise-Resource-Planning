import type { InvoiceIssuerTaxProfile } from './invoice-pdf-types';

export type { InvoiceIssuerTaxProfile };

export interface InvoiceTermTaxBreakdown {
  dppAmount: number;
  ppnRatePercent: number;
  ppnAmount: number;
  pph23RatePercent: number;
  pph23Amount: number;
  grossAmount: number;
  netAmount: number;
}

/**
 * Final tax rules (batch spec):
 * - DSK: PPN 0, PPh23 2% of DPP, gross = DPP, net = gross − PPh23
 * - DTAX: PPN 11% of DPP, PPh23 2% of DPP, gross = DPP + PPN, net = gross − PPh23
 */
export function computeInvoiceTermTax(dpp: number, profile: InvoiceIssuerTaxProfile): InvoiceTermTaxBreakdown {
  if (profile === 'DSK') {
    const ppnAmount = 0;
    const pph23Amount = Math.round(dpp * 0.02);
    const grossAmount = dpp;
    const netAmount = grossAmount - pph23Amount;
    return {
      dppAmount: dpp,
      ppnRatePercent: 0,
      ppnAmount,
      pph23RatePercent: 2,
      pph23Amount,
      grossAmount,
      netAmount,
    };
  }

  const ppnAmount = Math.round(dpp * 0.11);
  const pph23Amount = Math.round(dpp * 0.02);
  const grossAmount = dpp + ppnAmount;
  const netAmount = grossAmount - pph23Amount;
  return {
    dppAmount: dpp,
    ppnRatePercent: 11,
    ppnAmount,
    pph23RatePercent: 2,
    pph23Amount,
    grossAmount,
    netAmount,
  };
}
