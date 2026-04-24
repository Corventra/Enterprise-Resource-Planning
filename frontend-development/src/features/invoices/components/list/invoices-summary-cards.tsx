import { AlertTriangle, CheckCircle2, Clock3, FileText, ReceiptText, Wallet } from 'lucide-react';

interface InvoicesSummaryCardsProps {
  summary: {
    totalOutstanding: number;
    dueSoonCount: number;
    overdueCount: number;
    paidThisMonth: number;
    pendingVerification: number;
    readyToInvoice: number;
    needsFinalBilling: number;
  };
}

const formatCompactCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(amount);

const cards = [
  {
    label: 'Total Outstanding',
    valueKey: 'totalOutstanding' as const,
    hint: 'Belum lunas',
    icon: Wallet,
    iconClass: 'text-[#003c90] bg-[#003c90]/10',
    hintClass: 'text-[#006544]'
  },
  {
    label: 'Termin Jatuh Tempo',
    valueKey: 'dueSoonCount' as const,
    hint: '7 hari ke depan',
    icon: Clock3,
    iconClass: 'text-[#004b31] bg-[#004b31]/10',
    hintClass: 'text-[#006544]'
  },
  {
    label: 'Termin Overdue',
    valueKey: 'overdueCount' as const,
    hint: 'Perlu follow-up',
    icon: AlertTriangle,
    iconClass: 'text-[#93000a] bg-[#ffdad6]',
    hintClass: 'text-[#93000a]'
  },
  {
    label: 'Pembayaran Bulan Ini',
    valueKey: 'paidThisMonth' as const,
    hint: 'Cash in',
    icon: CheckCircle2,
    iconClass: 'text-[#004b31] bg-[#6ffbbe]/25',
    hintClass: 'text-[#006544]'
  },
  {
    label: 'Menunggu Verifikasi',
    valueKey: 'pendingVerification' as const,
    hint: 'Menunggu admin',
    icon: ReceiptText,
    iconClass: 'text-[#00419c] bg-[#d9e2ff]',
    hintClass: 'text-[#0f52ba]'
  },
  {
    label: 'Siap Dibuat Invoice',
    valueKey: 'readyToInvoice' as const,
    hint: 'Draft/ready',
    icon: FileText,
    iconClass: 'text-[#515f74] bg-[#d5e3fc]',
    hintClass: 'text-[#737784]'
  },
  {
    label: 'Perlu Tagihan Akhir',
    valueKey: 'needsFinalBilling' as const,
    hint: 'Retensi/final',
    icon: ReceiptText,
    iconClass: 'text-[#3a485b] bg-[#e0e3e5]',
    hintClass: 'text-[#737784]'
  }
];

export const InvoicesSummaryCards = ({ summary }: InvoicesSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, valueKey, hint, icon: Icon, iconClass, hintClass }) => {
        const value =
          valueKey === 'totalOutstanding' || valueKey === 'paidThisMonth'
            ? formatCompactCurrency(summary[valueKey])
            : summary[valueKey];

        return (
          <div
            key={valueKey}
            className="flex flex-col justify-between rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#eceef0]"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className={`rounded-full p-2 ${iconClass}`}>
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className={`text-[11px] font-bold ${hintClass}`}>{hint}</span>
            </div>
            <div>
              <p className="mb-0.5 text-xs font-medium text-[#737784]">{label}</p>
              <h3 className="text-2xl font-semibold tracking-tight text-[#191c1e]">{value}</h3>
            </div>
          </div>
        );
      })}
    </div>
  );
};
