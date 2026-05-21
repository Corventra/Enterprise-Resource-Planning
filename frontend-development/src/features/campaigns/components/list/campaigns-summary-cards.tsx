import { BarChart2, Bolt, Inbox, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CeoMetricDeltaFooter, CeoSummaryCard } from '../../../dashboard/components/ceo/ceo-dashboard-ui';
import { formatDashboardNumber } from '../../../dashboard/utils/format-dashboard';
import type { CampaignsSummary, CampaignSummaryMetric } from '../../types/campaign.types';

interface CampaignsSummaryCardsProps {
  summary: CampaignsSummary;
  comparisonLabel: string;
}

const snapshotCards: Array<{
  label: string;
  valueKey: 'total' | 'active';
  hint: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    label: 'Total Campaigns',
    valueKey: 'total',
    hint: 'Semua campaign',
    icon: LayoutGrid,
    accent: 'from-[#003c90] to-[#0f52ba]'
  },
  {
    label: 'Active Campaigns',
    valueKey: 'active',
    hint: 'Status aktif saat ini',
    icon: Bolt,
    accent: 'from-[#006544] to-[#2ea87a]'
  }
];

const periodCards: Array<{
  label: string;
  valueKey: 'totalSubmissions' | 'averagePerCampaign';
  icon: LucideIcon;
  accent: string;
}> = [
  {
    label: 'Total Submissions',
    valueKey: 'totalSubmissions',
    icon: Inbox,
    accent: 'from-[#0f52ba] to-[#2d6fd4]'
  },
  {
    label: 'Average / Campaign',
    valueKey: 'averagePerCampaign',
    icon: BarChart2,
    accent: 'from-[#434653] to-[#5c6070]'
  }
];

export const CampaignsSummaryCards = ({ summary, comparisonLabel }: CampaignsSummaryCardsProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {snapshotCards.map(({ label, valueKey, hint, icon, accent }) => (
      <CeoSummaryCard
        key={valueKey}
        title={label}
        value={formatDashboardNumber(summary[valueKey].value)}
        icon={icon}
        accent={accent}
        footer={<p className="text-xs text-[#737784]">{hint}</p>}
      />
    ))}
    {periodCards.map(({ label, valueKey, icon, accent }) => {
      const metric: CampaignSummaryMetric = summary[valueKey];
      return (
        <CeoSummaryCard
          key={valueKey}
          title={label}
          value={formatDashboardNumber(metric.value)}
          icon={icon}
          accent={accent}
          footer={<CeoMetricDeltaFooter metric={metric} comparisonLabel={comparisonLabel} currency={false} />}
        />
      );
    })}
  </div>
);
