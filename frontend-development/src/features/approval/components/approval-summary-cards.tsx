import { ClipboardList, FileSignature, FileText, Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CeoSummaryCard } from '../../dashboard/components/ceo/ceo-dashboard-ui';
import { formatDashboardNumber } from '../../dashboard/utils/format-dashboard';
import type { ApprovalSummary } from '../types/approval.types';

interface ApprovalSummaryCardsProps {
  summary: ApprovalSummary;
}

const cards: Array<{
  label: string;
  valueKey: keyof ApprovalSummary;
  hint: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    label: 'Total Pending',
    valueKey: 'totalPending',
    hint: 'Menunggu review CEO',
    icon: Inbox,
    accent: 'from-[#003c90] to-[#0f52ba]'
  },
  {
    label: 'Proposals',
    valueKey: 'proposals',
    hint: 'Proposal menunggu persetujuan',
    icon: ClipboardList,
    accent: 'from-[#0f52ba] to-[#2d6fd4]'
  },
  {
    label: 'Engagement Letters',
    valueKey: 'engagementLetters',
    hint: 'EL menunggu persetujuan',
    icon: FileSignature,
    accent: 'from-[#a16207] to-[#c49a00]'
  },
  {
    label: 'Handover Memos',
    valueKey: 'handoverMemos',
    hint: 'Memo handover menunggu persetujuan',
    icon: FileText,
    accent: 'from-[#006544] to-[#2ea87a]'
  }
];

export const ApprovalSummaryCards = ({ summary }: ApprovalSummaryCardsProps) => (
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
