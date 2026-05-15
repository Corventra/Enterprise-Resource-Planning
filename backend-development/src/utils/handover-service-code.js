/**
 * Business display codes for handover numbers: BD-HO-{ServiceCode}-{seq}-{year}.
 * Keys are `services.code` values from master data — not raw slugs from service names.
 */
const SERVICE_CODE_BY_DB_CODE = Object.freeze({
  TP_DOCUMENTATION_MF_LF_CBCR: 'TPDoc',
  TRANSFER_PRICING_ADVISORY: 'TPAdv',
  TP_TEMPLATE_MF_LF_BASIC: 'TPTpl',
  STRATEGIC_TAX_ADVISORY: 'STAdv',
  PENDAMPINGAN_PEMERIKSAAN_PAJAK: 'PPPajak',
  TAX_LITIGATION: 'TaxLit',
  TAX_DUE_DILIGENCE: 'TaxDD',
  BUSINESS_STRUCTURING_LEGAL_ENGINEERING: 'BSLeg',
  LEGAL_RISK_MAPPING_CONTRACT_REVIEW: 'LRisk',
  SUSTAINABILITY_REPORTING_FULL: 'SRFull',
  SUSTAINABILITY_REPORTING_BASIC: 'SRBasic',
  PENDIRIAN_BADAN_USAHA: 'Pendirian',
  VIRTUAL_OFFICE_DOMISILI_HUKUM: 'VirtOff',
  WEBSITE_COMPANY_PROFILE_BASIC: 'WebCo'
});

/** Optional fallback when only service name is available. */
const SERVICE_CODE_BY_NAME = Object.freeze({
  'Transfer Pricing Documentation (MF/LF/CbCR)': 'TPDoc',
  'Transfer Pricing Advisory': 'TPAdv',
  'Dokumentasi TP Template (MF/LF Basic Format)': 'TPTpl'
});

/**
 * @param {string|null|undefined} serviceDbCode - `services.code`
 * @param {string|null|undefined} [serviceName] - `services.name`
 * @returns {string} Short business code (e.g. TPDoc) or GEN if unmapped
 */
const resolveHandoverServiceCode = (serviceDbCode, serviceName = null) => {
  const dbCode = String(serviceDbCode ?? '').trim();
  if (dbCode && SERVICE_CODE_BY_DB_CODE[dbCode]) {
    return SERVICE_CODE_BY_DB_CODE[dbCode];
  }

  const name = String(serviceName ?? '').trim();
  if (name && SERVICE_CODE_BY_NAME[name]) {
    return SERVICE_CODE_BY_NAME[name];
  }

  return 'GEN';
};

module.exports = {
  SERVICE_CODE_BY_DB_CODE,
  SERVICE_CODE_BY_NAME,
  resolveHandoverServiceCode
};
