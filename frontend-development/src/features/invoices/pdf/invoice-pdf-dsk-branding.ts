/**
 * Static DSK letterhead & payment block for invoice PDFs.
 * Replace placeholders when official assets / copy are available.
 */
export const INVOICE_PDF_DSK_BRANDING = {
  companyName: 'PT DSK Global Konsultama',
  /** Used inside canonical invoice number segment "DSK Global". */
  companyShortInNumber: 'PT DSK Global Konsultama',
  addressLines: ['Ruko Cinere Bellevue', 'Jl. Telaga Warna, Pangkalan Jati Blok JC 01', 'Cinere, Kec. Cinere, Depok 161514'],
  npwpLabel: 'NPWP',
  npwpValue: '21.303.532.2-448.000',
  bankAccountHolder: 'PT DSK Global Konsultama',
  bankAccountNumber: '103-00-1191199-3',
  bankName: 'Bank Mandiri',
  paymentNote: 'Should you have any question, please contact us.',
  directorName: 'Galih Gumilang',
  directorTitle: 'Managing Director',
} as const;
