import { AlertTriangle, Clock3, FileText, ReceiptText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CeoSummaryCard } from '../../../dashboard/components/ceo/ceo-dashboard-ui';
import { formatDashboardNumber } from '../../../dashboard/utils/format-dashboard';

export interface InvoicesSummary {
  dueSoonCount: number;
  overdueCount: number;
  readyToInvoice: number;
  needsFinalBilling: number;
}

interface InvoicesSummaryCardsProps {
  summary: InvoicesSummary;
}

const cards: Array<{
  label: string;
  valueKey: keyof InvoicesSummary;
  hint: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    label: 'Termin Jatuh Tempo',
    valueKey: 'dueSoonCount',
    hint: '7 hari ke depan',
    icon: Clock3,
    accent: 'from-[#006544] to-[#2ea87a]'
  },
  {
    label: 'Termin Overdue',
    valueKey: 'overdueCount',
    hint: 'Perlu follow-up',
    icon: AlertTriangle,
    accent: 'from-[#ba1a1a] to-[#d94a4a]'
  },
  {
    label: 'Siap Dibuat Invoice',
    valueKey: 'readyToInvoice',
    hint: 'Status ready to bill',
    icon: FileText,
    accent: 'from-[#434653] to-[#5c6070]'
  },
  {
    label: 'Perlu Tagihan Akhir',
    valueKey: 'needsFinalBilling',
    hint: 'Retensi / final billing',
    icon: ReceiptText,
    accent: 'from-[#a16207] to-[#c49a00]'
  }
];

export const InvoicesSummaryCards = ({ summary }: InvoicesSummaryCardsProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {cards.map(({ label, valueKey, hint, icon, accent }) => (
      <CeoSummaryCard
        key={valueKey}
        title={label}
        value={formatDashboardNumber(summary[valueKey])}
        icon={icon}
        accent={accent}
        footer={<p className="text-xs text-[#737784]">{hint}</p>}
      />
    ))}
  </div>
);
