import { CheckCircle2, ListChecks, Trophy, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CeoMetricDeltaFooter, CeoSummaryCard } from '../../../dashboard/components/ceo/ceo-dashboard-ui';
import { formatDashboardNumber } from '../../../dashboard/utils/format-dashboard';
import type { LeadTrackerSummary, LeadTrackerSummaryMetric } from '../../types/lead-tracker.types';

interface LeadTrackerSummaryCardsProps {
  summary: LeadTrackerSummary;
  comparisonLabel: string;
}

type PeriodCardKey = 'totalLeads' | 'wonLeads' | 'lostLeads';

const cardOrder: Array<
  | { kind: 'period'; label: string; valueKey: PeriodCardKey; icon: LucideIcon; accent: string }
  | { kind: 'snapshot'; label: string; valueKey: 'activeLeads'; hint: string; icon: LucideIcon; accent: string }
> = [
  {
    kind: 'period',
    label: 'Total Leads',
    valueKey: 'totalLeads',
    icon: ListChecks,
    accent: 'from-[#003c90] to-[#0f52ba]'
  },
  {
    kind: 'snapshot',
    label: 'Active',
    valueKey: 'activeLeads',
    hint: 'Pipeline aktif saat ini',
    icon: CheckCircle2,
    accent: 'from-[#0f52ba] to-[#2d6fd4]'
  },
  {
    kind: 'period',
    label: 'Won',
    valueKey: 'wonLeads',
    icon: Trophy,
    accent: 'from-[#006544] to-[#2ea87a]'
  },
  {
    kind: 'period',
    label: 'Lost',
    valueKey: 'lostLeads',
    icon: XCircle,
    accent: 'from-[#434653] to-[#5c6070]'
  }
];

export const LeadTrackerSummaryCards = ({ summary, comparisonLabel }: LeadTrackerSummaryCardsProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {cardOrder.map((cfg) => {
      if (cfg.kind === 'snapshot') {
        return (
          <CeoSummaryCard
            key={cfg.valueKey}
            title={cfg.label}
            value={formatDashboardNumber(summary[cfg.valueKey].value)}
            icon={cfg.icon}
            accent={cfg.accent}
            footer={<p className="text-xs text-[#737784]">{cfg.hint}</p>}
          />
        );
      }
      const metric: LeadTrackerSummaryMetric = summary[cfg.valueKey];
      return (
        <CeoSummaryCard
          key={cfg.valueKey}
          title={cfg.label}
          value={formatDashboardNumber(metric.value)}
          icon={cfg.icon}
          accent={cfg.accent}
          footer={<CeoMetricDeltaFooter metric={metric} comparisonLabel={comparisonLabel} currency={false} />}
        />
      );
    })}
  </div>
);
