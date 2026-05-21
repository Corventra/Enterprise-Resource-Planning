import { CheckCircle2, FileText, Hourglass, PencilLine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CeoSummaryCard } from '../../../dashboard/components/ceo/ceo-dashboard-ui';
import { formatDashboardNumber } from '../../../dashboard/utils/format-dashboard';
import type { HandoverSummary } from '../../types/handover.types';

interface HandoverSummaryCardsProps {
  summary: HandoverSummary;
}

const cards: Array<{
  label: string;
  valueKey: keyof HandoverSummary;
  hint: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    label: 'Total Handover',
    valueKey: 'totalHandover',
    hint: 'Semua memo handover',
    icon: FileText,
    accent: 'from-[#003c90] to-[#0f52ba]'
  },
  {
    label: 'Drafts',
    valueKey: 'totalDraft',
    hint: 'Draft & perlu revisi',
    icon: PencilLine,
    accent: 'from-[#a16207] to-[#c49a00]'
  },
  {
    label: 'Awaiting Approval',
    valueKey: 'totalAwaitingApproval',
    hint: 'Menunggu persetujuan CEO',
    icon: Hourglass,
    accent: 'from-[#0f52ba] to-[#2d6fd4]'
  },
  {
    label: 'Approved & Active',
    valueKey: 'totalActive',
    hint: 'Disetujui & dalam pipeline',
    icon: CheckCircle2,
    accent: 'from-[#006544] to-[#2ea87a]'
  }
];

export const HandoverSummaryCards = ({ summary }: HandoverSummaryCardsProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {cards.map(({ label, valueKey, hint, icon, accent }) => (
      <CeoSummaryCard
        key={valueKey}
        title={label}
        value={formatDashboardNumber(summary[valueKey].value)}
        icon={icon}
        accent={accent}
        footer={<p className="text-xs text-[#737784]">{hint}</p>}
      />
    ))}
  </div>
);
