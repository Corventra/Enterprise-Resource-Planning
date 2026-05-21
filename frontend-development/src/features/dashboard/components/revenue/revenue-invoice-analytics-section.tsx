import { Banknote, CircleDollarSign, Clock, Receipt } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RevenueInvoiceAnalytics } from '../../types/revenue-analytics.types';
import { formatDashboardCurrency } from '../../utils/format-dashboard';
import {
  CeoMetricDeltaFooter,
  CeoPanel,
  CeoSectionHeader,
  CeoSummaryCard,
  ceoSectionClass
} from '../ceo/ceo-dashboard-ui';
import { InvoiceStatusDistributionChart } from './invoice-status-distribution-chart';
import { MonthlyRevenueHealthChart } from './monthly-revenue-health-chart';
import { PaymentReceivedTrendChart } from './payment-received-trend-chart';
import { TopClientsOverdueList } from './top-clients-overdue-list';

const summaryCards: Array<{
  key: keyof RevenueInvoiceAnalytics['summary'];
  label: string;
  icon: LucideIcon;
  accent: string;
}> = [
  { key: 'total_invoiced', label: 'Total Invoiced', icon: Receipt, accent: 'from-[#003c90] to-[#0f52ba]' },
  { key: 'total_paid', label: 'Total Paid', icon: Banknote, accent: 'from-[#006544] to-[#2ea87a]' },
  { key: 'total_outstanding', label: 'Total Outstanding', icon: CircleDollarSign, accent: 'from-[#8a6d00] to-[#c49a00]' },
  { key: 'total_overdue', label: 'Total Overdue', icon: Clock, accent: 'from-[#ba1a1a] to-[#d94a4a]' }
];

interface RevenueInvoiceAnalyticsSectionProps {
  revenue: RevenueInvoiceAnalytics;
  comparisonLabel: string;
  title?: string;
  description?: string;
}

export const RevenueInvoiceAnalyticsSection = ({
  revenue,
  comparisonLabel,
  title = 'Analitik Revenue & Invoice',
  description = 'Performa penagihan, pembayaran, outstanding, dan prioritas overdue.'
}: RevenueInvoiceAnalyticsSectionProps) => {
  const { total_paid, total_outstanding, total_invoiced } = revenue.summary;
  const paidPct = total_invoiced > 0 ? Math.round((total_paid / total_invoiced) * 100) : 0;
  const barTotal = total_paid + total_outstanding;
  const paidBarPct = barTotal > 0 ? Math.round((total_paid / barTotal) * 100) : 0;
  const outstandingBarPct = barTotal > 0 ? 100 - paidBarPct : 0;
  const topOverdueTotal = revenue.top_clients_overdue.reduce((sum, row) => sum + row.overdue_amount, 0);

  return (
    <section className={ceoSectionClass}>
      <CeoSectionHeader title={title} description={description} />

      <article className="rounded-2xl border border-[#e4e7ec] bg-gradient-to-br from-[#f8faff] via-white to-white p-4 shadow-sm sm:p-5">
        <h3 className="text-sm font-bold text-[#191c1e]">Paid vs Outstanding</h3>
        <p className="mt-0.5 text-xs text-[#737784]">
          {paidPct}% invoiced periode sudah terbayar · Outstanding per akhir periode:{' '}
          {formatDashboardCurrency(total_outstanding)}
        </p>
        <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-[#eef1f6]">
          <div
            className="bg-gradient-to-r from-[#006544] to-[#2ea87a]"
            style={{ width: `${paidBarPct}%` }}
            title={`Paid ${formatDashboardCurrency(total_paid)}`}
          />
          <div
            className="bg-gradient-to-r from-[#c49a00] to-[#e8b800]"
            style={{ width: `${outstandingBarPct}%` }}
            title={`Outstanding ${formatDashboardCurrency(total_outstanding)}`}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#434653]">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#006544]" /> Paid ({formatDashboardCurrency(total_paid)})
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#c49a00]" /> Outstanding (
            {formatDashboardCurrency(total_outstanding)})
          </span>
        </div>
      </article>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <CeoSummaryCard
            key={card.key}
            title={card.label}
            value={formatDashboardCurrency(revenue.summary[card.key])}
            icon={card.icon}
            accent={card.accent}
            footer={
              <CeoMetricDeltaFooter
                metric={revenue.summary_metrics[card.key]}
                comparisonLabel={comparisonLabel}
              />
            }
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CeoPanel title="Tren Pembayaran Diterima" subtitle="Bar chart arus kas masuk per bulan (pembayaran terverifikasi)">
          <PaymentReceivedTrendChart points={revenue.payment_trend} />
        </CeoPanel>
        <CeoPanel
          title="Kesehatan Pendapatan Bulanan"
          subtitle="Grouped bar per bulan — Paid (arus masuk) vs Outstanding (akhir bulan)"
        >
          <MonthlyRevenueHealthChart points={revenue.paid_vs_outstanding_trend} />
        </CeoPanel>
        <CeoPanel title="Distribusi Status Invoice" subtitle="Jumlah termin per status (snapshot saat ini)">
          <InvoiceStatusDistributionChart distribution={revenue.invoice_status_distribution} />
        </CeoPanel>
        <CeoPanel
          title="Klien dengan Overdue Terbesar"
          subtitle="Prioritas penagihan per akhir periode — tagihan terkirim & lewat jatuh tempo"
          insight={
            topOverdueTotal > 0
              ? `Top ${revenue.top_clients_overdue.length} klien memegang ${formatDashboardCurrency(topOverdueTotal)} dari tunggakan overdue yang teridentifikasi.`
              : undefined
          }
        >
          <TopClientsOverdueList clients={revenue.top_clients_overdue} />
        </CeoPanel>
      </div>
    </section>
  );
};
