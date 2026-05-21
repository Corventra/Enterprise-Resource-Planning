import { FileInput, Target, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MarketingAnalytics } from '../../types/marketing-analytics.types';
import { formatDashboardNumber, formatDashboardPercent } from '../../utils/format-dashboard';
import { CeoMetricDeltaBadge, CeoPanel, CeoSectionHeader, CeoSummaryCard, ceoSectionClass } from '../ceo/ceo-dashboard-ui';
import { RankedHorizontalBarList } from '../ranked-horizontal-bar-list';
import { SubmissionVsLeadChart } from './submission-vs-lead-chart';

const deltaPercent = (current: number, previous: number) => {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

interface MarketingAnalyticsSectionProps {
  marketing: MarketingAnalytics;
  comparisonLabel: string;
  title?: string;
  description?: string;
}

export const MarketingAnalyticsSection = ({
  marketing,
  comparisonLabel,
  title = 'Marketing Analytics',
  description = 'Akuisisi form lead capture: volume, kualitas conversion, dan sumber performa terbaik.'
}: MarketingAnalyticsSectionProps) => {
  const { period_summary: summary } = marketing;
  const chartPoints = marketing.monthly_acquisition.map((p) => ({
    label: p.label,
    submissions: p.submissions,
    leads: p.leads
  }));

  const conversionDelta = deltaPercent(summary.conversion_rate, summary.previous.conversion_rate);
  const conversionDeltaText =
    conversionDelta === 0
      ? 'Conversion rate flat dibanding periode sebelumnya.'
      : conversionDelta > 0
        ? `Conversion rate naik ${formatDashboardPercent(conversionDelta)} ${comparisonLabel.toLowerCase()}.`
        : `Conversion rate turun ${formatDashboardPercent(Math.abs(conversionDelta))} ${comparisonLabel.toLowerCase()}.`;

  const summaryCards: Array<{
    title: string;
    description: string;
    value: string;
    icon: LucideIcon;
    accent: string;
    metric: { value: number; previous: number; delta: { value: number; direction: 'up' | 'down' | 'flat' } };
    formatPrevious: (n: number) => string;
  }> = [
    {
      title: 'Submission Periode Aktif',
      description: 'Volume form lead capture — respons masuk dari campaign akuisisi',
      value: formatDashboardNumber(summary.submissions),
      icon: FileInput,
      accent: 'from-[#003c90] to-[#0f52ba]',
      metric: {
        value: summary.submissions,
        previous: summary.previous.submissions,
        delta: {
          value: Math.abs(deltaPercent(summary.submissions, summary.previous.submissions)),
          direction:
            summary.submissions > summary.previous.submissions
              ? 'up'
              : summary.submissions < summary.previous.submissions
                ? 'down'
                : 'flat'
        }
      },
      formatPrevious: formatDashboardNumber
    },
    {
      title: 'Lead Periode Aktif',
      description: 'Lead dari form lead capture yang masuk pipeline',
      value: formatDashboardNumber(summary.leads),
      icon: Target,
      accent: 'from-[#006544] to-[#2ea87a]',
      metric: {
        value: summary.leads,
        previous: summary.previous.leads,
        delta: {
          value: Math.abs(deltaPercent(summary.leads, summary.previous.leads)),
          direction:
            summary.leads > summary.previous.leads ? 'up' : summary.leads < summary.previous.leads ? 'down' : 'flat'
        }
      },
      formatPrevious: formatDashboardNumber
    },
    {
      title: 'Conversion Rate',
      description: 'Efektivitas lead capture — lead ÷ submission form lead capture',
      value: formatDashboardPercent(summary.conversion_rate),
      icon: TrendingUp,
      accent: 'from-[#8a6d00] to-[#c49a00]',
      metric: {
        value: summary.conversion_rate,
        previous: summary.previous.conversion_rate,
        delta: {
          value: Math.abs(conversionDelta),
          direction:
            summary.conversion_rate > summary.previous.conversion_rate
              ? 'up'
              : summary.conversion_rate < summary.previous.conversion_rate
                ? 'down'
                : 'flat'
        }
      },
      formatPrevious: formatDashboardPercent
    }
  ];

  return (
    <section className={ceoSectionClass}>
      <CeoSectionHeader title={title} description={description} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:items-stretch">
        <CeoPanel
          className="md:col-span-3 !p-3 [&>div:first-child]:mb-2 [&>div:first-child]:pb-2 [&_h3]:text-[13px] [&_p]:text-[10px]"
          title="Perbandingan Lead Capture"
          subtitle="Perbandingan submission lead capture vs lead terbentuk — 6 bulan terakhir"
        >
          <SubmissionVsLeadChart points={chartPoints} />
        </CeoPanel>

        <article className="flex h-full flex-col rounded-xl border border-[#dce8ff] bg-gradient-to-br from-[#f8faff] to-white p-3 shadow-sm sm:p-3.5 md:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#003c90]">Kualitas Akuisisi</p>
          <h3 className="mt-0.5 text-[13px] font-bold text-[#191c1e]">Conversion → Lead</h3>

          <div className="mt-3 rounded-lg border border-[#dce8ff] bg-[#eef3fb] px-3 py-2 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#003c90]">Conversion Rate</p>
            <p className="text-xl font-bold leading-tight text-[#003c90]">
              {formatDashboardPercent(summary.conversion_rate)}
            </p>
          </div>

          {summary.submissions > 0 ? (
            <p className="mt-3 text-xs leading-relaxed text-[#434653]">
              Dari <span className="font-semibold text-[#003c90]">{formatDashboardNumber(summary.submissions)}</span>{' '}
              submission, <span className="font-semibold text-[#006544]">{formatDashboardNumber(summary.leads)}</span>{' '}
              jadi lead ({formatDashboardPercent(summary.conversion_rate)}).
            </p>
          ) : (
            <p className="mt-3 text-xs text-[#737784]">Belum ada submission lead capture.</p>
          )}

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eef1f6]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#003c90] to-[#006544]"
              style={{ width: `${Math.min(summary.conversion_rate, 100)}%` }}
            />
          </div>

          <p className="mt-2 text-[10px] leading-snug text-[#737784]">{conversionDeltaText}</p>

          <p className="mt-auto pt-3 text-[10px] text-[#737784]">
            Gap: {formatDashboardNumber(Math.max(summary.submissions - summary.leads, 0))} belum jadi lead.
          </p>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <CeoSummaryCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            accent={card.accent}
            footer={
              <div className="space-y-1.5">
                <p className="text-xs text-[#737784]">{card.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <CeoMetricDeltaBadge metric={card.metric} />
                  <span className="text-xs text-[#737784]">
                    vs {comparisonLabel.toLowerCase()} ·{' '}
                    <span className="font-semibold text-[#434653]">{card.formatPrevious(card.metric.previous)}</span>
                  </span>
                </div>
              </div>
            }
          />
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-[#191c1e]">Sumber Performa Terbaik</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CeoPanel title="Top Campaign" subtitle="Campaign dengan lead terbanyak">
            <RankedHorizontalBarList items={marketing.top_campaigns.map((c) => ({ name: c.name, value: c.lead_count }))} />
          </CeoPanel>
          <CeoPanel title="Top Channel" subtitle="Channel akuisisi terbaik">
            <RankedHorizontalBarList
              items={marketing.top_channels.map((c) => ({ name: c.name, value: c.lead_count, subtitle: c.code }))}
              accentClass="from-[#0f52ba] to-[#2d6fd4]"
            />
          </CeoPanel>
          <CeoPanel title="Top Topic" subtitle="Topik campaign paling efektif">
            <RankedHorizontalBarList
              items={marketing.top_topics.map((t) => ({ name: t.name, value: t.lead_count }))}
              accentClass="from-[#434653] to-[#5c6070]"
            />
          </CeoPanel>
        </div>
      </div>
    </section>
  );
};
