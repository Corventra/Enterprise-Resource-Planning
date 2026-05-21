import {
  Briefcase,
  Calendar,
  FileCheck,
  FileText,
  Handshake,
  TrendingDown,
  Users,
  XCircle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PipelineAnalytics, PipelineKpiMetric } from '../../types/pipeline-analytics.types';
import { formatDashboardNumber, formatDashboardPercent } from '../../utils/format-dashboard';
import { CeoMetricDeltaBadge, CeoPanel, CeoSectionHeader, CeoSummaryCard, ceoSectionClass } from '../ceo/ceo-dashboard-ui';
import { PipelineCommercialOutcome } from './pipeline-commercial-outcome.tsx';
import { PipelineDocumentTrendChart } from './pipeline-document-trend-chart.tsx';
import { PipelineFunnelLegend, PipelineFunnelVisual } from './pipeline-funnel-visual.tsx';

interface PipelineAnalyticsSectionProps {
  pipeline: PipelineAnalytics;
  comparisonLabel: string;
  title?: string;
  description?: string;
}

const pipelineKpiConfig: Array<{
  key: keyof PipelineAnalytics['kpi_cards'];
  title: string;
  icon: LucideIcon;
  accent: string;
}> = [
  { key: 'total_lead', title: 'Total Lead Aktif', icon: Users, accent: 'from-[#003c90] to-[#0f52ba]' },
  { key: 'meeting', title: 'Meeting', icon: Calendar, accent: 'from-[#0f52ba] to-[#2d6fd4]' },
  { key: 'minutes_completed', title: 'Minutes Completed', icon: FileText, accent: 'from-[#2d6fd4] to-[#5a8fe0]' },
  { key: 'proposal', title: 'Proposal Dibuat', icon: Briefcase, accent: 'from-[#434653] to-[#5c6070]' },
  { key: 'el_signed', title: 'EL Signed / Won', icon: Handshake, accent: 'from-[#006544] to-[#2ea87a]' },
  { key: 'handover_approved', title: 'Handover Approved', icon: FileCheck, accent: 'from-[#8a6d00] to-[#c49a00]' },
  { key: 'lost', title: 'Lost', icon: XCircle, accent: 'from-[#ba1a1a] to-[#d64545]' }
];

const PipelineKpiFooter = ({ metric, comparisonLabel }: { metric: PipelineKpiMetric; comparisonLabel: string }) => (
  <div className="flex flex-wrap items-center gap-2">
    <CeoMetricDeltaBadge metric={metric} />
    <span className="text-xs text-[#737784]">
      {comparisonLabel.toLowerCase()} ·{' '}
      <span className="font-semibold text-[#434653]">{formatDashboardNumber(metric.previous)}</span>
    </span>
  </div>
);

export const PipelineAnalyticsSection = ({
  pipeline,
  comparisonLabel,
  title = 'Pipeline / Sales Analytics',
  description = 'Volume lead unik per stage, konversi, bottleneck proses, dan outcome komersial.'
}: PipelineAnalyticsSectionProps) => {
  const { kpi_cards: kpis, commercial_outcome: outcome, bottleneck } = pipeline;

  return (
    <section className={ceoSectionClass}>
      <CeoSectionHeader title={title} description={description} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {pipelineKpiConfig.map((cfg) => {
          const metric = kpis[cfg.key];
          return (
            <CeoSummaryCard
              key={cfg.key}
              title={cfg.title}
              value={formatDashboardNumber(metric.value)}
              icon={cfg.icon}
              accent={cfg.accent}
              compact
              footer={<PipelineKpiFooter metric={metric} comparisonLabel={comparisonLabel} />}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
        <CeoPanel
          className="lg:col-span-7"
          title="Analisis Funnel Sales"
          subtitle="Volume lead unik per tahap — periode aktif"
          headerRight={<PipelineFunnelLegend />}
        >
          <PipelineFunnelVisual
            funnel={pipeline.funnel}
            conversions={pipeline.conversions}
            totalConversion={pipeline.total_conversion}
          />
        </CeoPanel>

        <div className="lg:col-span-5">
          <PipelineCommercialOutcome outcome={outcome} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
        <CeoPanel
          className="lg:col-span-7"
          title="Tren Output Dokumen Komersial"
          subtitle="Proposal, EL Signed, dan Handover Approved — 6 bulan terakhir"
        >
          <PipelineDocumentTrendChart points={pipeline.document_trend} />
        </CeoPanel>

        <CeoPanel className="lg:col-span-5" title="Bottleneck Utama" subtitle="Transisi operasional dengan konversi terendah">
          {bottleneck ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-[#fdeccc] bg-[#fffbf0] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fdeccc] text-[#8a6d00]">
                  <TrendingDown className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a6d00]">Bottleneck proses</p>
                  <p className="mt-1 text-base font-bold text-[#191c1e]">{bottleneck.label}</p>
                  <p className="mt-1 text-2xl font-bold text-[#ba1a1a]">{formatDashboardPercent(bottleneck.rate)}</p>
                </div>
              </div>
              <p className="text-sm text-[#434653]">
                <span className="font-semibold">{formatDashboardNumber(bottleneck.stuck_count)}</span> lead tertahan (
                {formatDashboardNumber(bottleneck.from_count)} → {formatDashboardNumber(bottleneck.to_count)}).
              </p>
              {bottleneck.narrative ? (
                <p className="rounded-lg bg-[#f8f9fb] px-3 py-2 text-xs leading-relaxed text-[#434653]">
                  {bottleneck.narrative}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-[#737784]">Belum cukup data untuk menghitung bottleneck.</p>
          )}
        </CeoPanel>
      </div>
    </section>
  );
};
