/**
 * Tax breakdown per invoice term (aligned with invoice PDF / EL signed provisioning).
 * DSK: PPN 0, PPh23 2% of DPP, gross = DPP, net = gross − PPh23
 * DTAX: PPN 11% of DPP, PPh23 2% of DPP, gross = DPP + PPN, net = gross − PPh23
 */
const computeInvoiceTermTax = (dppRaw, issuerCompany) => {
  const dpp = Math.round(Number(dppRaw));
  if (!Number.isFinite(dpp) || dpp < 0) {
    throw new Error('DPP amount tidak valid.');
  }

  if (issuerCompany === 'DSK') {
    const ppnAmount = 0;
    const pph23Amount = Math.round(dpp * 0.02);
    const grossAmount = dpp;
    const netAmount = grossAmount - pph23Amount;
    return {
      dpp_amount: dpp,
      ppn_rate: 0,
      ppn_amount: ppnAmount,
      pph23_rate: 2,
      pph23_amount: pph23Amount,
      gross_amount: grossAmount,
      net_amount: netAmount
    };
  }

  if (issuerCompany === 'DTAX') {
    const ppnAmount = Math.round(dpp * 0.11);
    const pph23Amount = Math.round(dpp * 0.02);
    const grossAmount = dpp + ppnAmount;
    const netAmount = grossAmount - pph23Amount;
    return {
      dpp_amount: dpp,
      ppn_rate: 11,
      ppn_amount: ppnAmount,
      pph23_rate: 2,
      pph23_amount: pph23Amount,
      gross_amount: grossAmount,
      net_amount: netAmount
    };
  }

  throw new Error(`Issuer company tidak dikenal: ${issuerCompany}`);
};

module.exports = { computeInvoiceTermTax };
