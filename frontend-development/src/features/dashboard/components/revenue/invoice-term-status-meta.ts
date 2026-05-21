/** Selaras `invoice_terms.status` & label di `features/invoices/utils/map-api-invoice.ts` */
/** Urutan tampilan dashboard (Paid sebelum Overdue, seperti mock referensi). */
export const INVOICE_TERM_STATUS_ORDER = [
  'DRAFT',
  'READY_TO_ISSUE',
  'ISSUED',
  'SENT',
  'PAID',
  'OVERDUE'
] as const;

export type InvoiceTermStatusDb = (typeof INVOICE_TERM_STATUS_ORDER)[number];

export const INVOICE_TERM_STATUS_META: Record<
  InvoiceTermStatusDb,
  { label: string; barColor: string; dotClass: string }
> = {
  DRAFT: {
    label: 'Draft',
    barColor: '#9ca3af',
    dotClass: 'bg-[#9ca3af]'
  },
  READY_TO_ISSUE: {
    label: 'Ready to Issue',
    barColor: '#191c1e',
    dotClass: 'bg-[#191c1e]'
  },
  ISSUED: {
    label: 'Issued',
    barColor: '#0f52ba',
    dotClass: 'bg-[#0f52ba]'
  },
  SENT: {
    label: 'Sent',
    barColor: '#0f52ba',
    dotClass: 'bg-[#0f52ba]'
  },
  PAID: {
    label: 'Paid',
    barColor: '#006544',
    dotClass: 'bg-[#006544]'
  },
  OVERDUE: {
    label: 'Overdue',
    barColor: '#ba1a1a',
    dotClass: 'bg-[#ba1a1a]'
  }
};
