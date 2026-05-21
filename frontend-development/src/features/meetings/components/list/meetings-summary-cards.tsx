import { CalendarCheck2, CalendarClock, CalendarDays, CheckCircle2, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CeoSummaryCard } from '../../../dashboard/components/ceo/ceo-dashboard-ui';
import { formatDashboardNumber } from '../../../dashboard/utils/format-dashboard';
import type { MeetingMonitorSummary } from '../../types/meetings.types';

interface MeetingsSummaryCardsProps {
  summary: MeetingMonitorSummary;
}

const cards: Array<{
  label: string;
  valueKey: keyof MeetingMonitorSummary;
  hint: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    label: 'Total Meeting',
    valueKey: 'totalMeeting',
    hint: 'Semua meeting dalam scope',
    icon: CalendarDays,
    accent: 'from-[#003c90] to-[#0f52ba]'
  },
  {
    label: 'Meeting Hari Ini',
    valueKey: 'today',
    hint: 'Jadwal hari ini',
    icon: CalendarClock,
    accent: 'from-[#0f52ba] to-[#2d6fd4]'
  },
  {
    label: 'Meeting Mendatang',
    valueKey: 'upcoming',
    hint: 'Terjadwal & belum lewat',
    icon: CalendarCheck2,
    accent: 'from-[#006544] to-[#2ea87a]'
  },
  {
    label: 'Meeting Selesai',
    valueKey: 'completed',
    hint: 'Status selesai',
    icon: CheckCircle2,
    accent: 'from-[#434653] to-[#5c6070]'
  },
  {
    label: 'Belum Ada Minutes',
    valueKey: 'noMinutes',
    hint: 'Perlu notulensi',
    icon: FileText,
    accent: 'from-[#a16207] to-[#c49a00]'
  }
];

export const MeetingsSummaryCards = ({ summary }: MeetingsSummaryCardsProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
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
