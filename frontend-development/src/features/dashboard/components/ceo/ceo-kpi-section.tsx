import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  FileCheck2,
  FileSignature,
  Handshake,
  Target,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import type { CeoKpiMetric } from '../../types/ceo-dashboard.types';
import { formatDashboardCurrency, formatDashboardNumber } from '../../utils/format-dashboard';
import { CeoMetricDeltaFooter, CeoSectionHeader, CeoSummaryCard, ceoSectionClass } from './ceo-dashboard-ui';

interface CeoKpiSectionProps {
  kpis: {
    total_lead: CeoKpiMetric;
    client_won: CeoKpiMetric;
    proposals_created: CeoKpiMetric;
    engagement_letters_signed: CeoKpiMetric;
    handovers_approved: CeoKpiMetric;
    payments_received: CeoKpiMetric;
    invoice_outstanding: CeoKpiMetric;
    overdue_amount: CeoKpiMetric;
  };
  comparisonLabel: string;
}

const kpiConfig: Array<{
  key: keyof CeoKpiSectionProps['kpis'];
  title: string;
  currency?: boolean;
  icon: LucideIcon;
  accent: string;
}> = [
  { key: 'total_lead', title: 'Total Lead', icon: Users, accent: 'from-[#003c90] to-[#0f52ba]' },
  { key: 'client_won', title: 'Client Won', icon: Target, accent: 'from-[#006544] to-[#1a8a6a]' },
  { key: 'proposals_created', title: 'Proposal Created', icon: FileCheck2, accent: 'from-[#0f52ba] to-[#2d6fd4]' },
  { key: 'engagement_letters_signed', title: 'Engagement Letter Signed', icon: FileSignature, accent: 'from-[#2d6fd4] to-[#5a8fe0]' },
  { key: 'handovers_approved', title: 'Handover Approved', icon: Handshake, accent: 'from-[#434653] to-[#5c6070]' },
  { key: 'payments_received', title: 'Pembayaran Received', icon: Banknote, accent: 'from-[#006544] to-[#2ea87a]', currency: true },
  {
    key: 'invoice_outstanding',
    title: 'Outstanding (Akhir Periode)',
    icon: Wallet,
    accent: 'from-[#8a6d00] to-[#c49a00]',
    currency: true
  },
  {
    key: 'overdue_amount',
    title: 'Overdue (Akhir Periode)',
    icon: TrendingUp,
    accent: 'from-[#ba1a1a] to-[#d94a4a]',
    currency: true
  }
];

export const CeoKpiSection = ({ kpis, comparisonLabel }: CeoKpiSectionProps) => (
  <section className={ceoSectionClass}>
    <CeoSectionHeader
      title="Executive Summary"
      description="Indikator utama pipeline, approval, dan revenue untuk periode yang dipilih."
      badge="8 KPI"
    />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpiConfig.map((cfg) => {
        const metric = kpis[cfg.key];
        const formattedValue = cfg.currency ? formatDashboardCurrency(metric.value) : formatDashboardNumber(metric.value);

        return (
          <CeoSummaryCard
            key={cfg.key}
            title={cfg.title}
            value={formattedValue}
            icon={cfg.icon}
            accent={cfg.accent}
            footer={<CeoMetricDeltaFooter metric={metric} comparisonLabel={comparisonLabel} currency={cfg.currency} />}
          />
        );
      })}
    </div>
  </section>
);
