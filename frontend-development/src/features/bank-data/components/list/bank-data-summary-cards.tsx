import { Archive, Inbox, ListChecks, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CeoSummaryCard } from '../../../dashboard/components/ceo/ceo-dashboard-ui';
import { formatDashboardNumber } from '../../../dashboard/utils/format-dashboard';

interface BankDataSummaryCardsProps {
  summary: {
    totalEntries: number;
    newEntries: number;
    processedEntries: number;
    archivedEntries: number;
  };
}

const cards: Array<{
  label: string;
  valueKey: keyof BankDataSummaryCardsProps['summary'];
  hint: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    label: 'Total Entries',
    valueKey: 'totalEntries',
    hint: 'Semua sumber data',
    icon: ListChecks,
    accent: 'from-[#003c90] to-[#0f52ba]'
  },
  {
    label: 'New',
    valueKey: 'newEntries',
    hint: 'Perlu ditindaklanjuti',
    icon: Sparkles,
    accent: 'from-[#0f52ba] to-[#2d6fd4]'
  },
  {
    label: 'Processed',
    valueKey: 'processedEntries',
    hint: 'Sudah diproses',
    icon: Inbox,
    accent: 'from-[#006544] to-[#2ea87a]'
  },
  {
    label: 'Archived',
    valueKey: 'archivedEntries',
    hint: 'Disimpan di arsip',
    icon: Archive,
    accent: 'from-[#434653] to-[#5c6070]'
  }
];

export const BankDataSummaryCards = ({ summary }: BankDataSummaryCardsProps) => (
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
