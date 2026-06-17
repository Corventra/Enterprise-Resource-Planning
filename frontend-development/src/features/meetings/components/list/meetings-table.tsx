import { Building2, Video } from 'lucide-react';
import type { ReactNode } from 'react';
import type { MeetingMonitorItem } from '../../types/meetings.types';
import {
  formatMeetingDateLines,
  getMeetingAccessHref,
  meetingModeTableLabel,
  meetingStatusClass,
  meetingStatusLabel,
  meetingTableClampClassName,
  minutesStatusClass,
  minutesStatusLabel
} from '../../utils/meetings-display';
import { isMeetingScheduleOverdue } from '../../utils/meeting-schedule-due-date';
import { MeetingsTableRowActions } from './meetings-table-row-actions';

interface MeetingsTableProps {
  items: MeetingMonitorItem[];
  selectedMeetingId?: string;
  canMarkComplete: boolean;
  onView: (item: MeetingMonitorItem) => void;
  onMarkComplete: (item: MeetingMonitorItem) => void;
  footer?: ReactNode;
}

const rowCellClassName = 'px-2 py-3.5 align-top first:pl-5 last:pr-5';

const platformIcon = (mode: MeetingMonitorItem['mode']) => {
  if (mode === 'ONLINE') return <Video className="h-4 w-4 shrink-0 text-[#0f52ba]" />;
  return <Building2 className="h-4 w-4 shrink-0 text-[#434653]" />;
};

export const MeetingsTable = ({
  items,
  selectedMeetingId,
  canMarkComplete,
  onView,
  onMarkComplete,
  footer
}: MeetingsTableProps) => (
  <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-left">
        <thead>
          <tr className="bg-[#f2f4f6]/70 text-[11px] font-bold uppercase tracking-wider text-[#737784]">
            <th className="min-w-[140px] px-5 py-3">Perusahaan</th>
            <th className="min-w-[120px] px-4 py-3">Meeting Title</th>
            <th className="w-1 whitespace-nowrap px-4 py-3">Platform/Location</th>
            <th className="w-[180px] max-w-[180px] px-4 py-3">Notes</th>
            <th className="min-w-[100px] px-4 py-3">Handled By</th>
            <th className="w-1 whitespace-nowrap px-4 py-3 text-right">Status</th>
            <th className="w-1 whitespace-nowrap px-4 py-3 text-right">Minutes</th>
            <th className="w-1 whitespace-nowrap px-5 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {items.map((item) => {
            const access = item.meetingAccess.trim();
            const modeLabel = meetingModeTableLabel(item.mode);
            const { dateLine, timeLine } = formatMeetingDateLines(item.meetingDatetime);
            const accessHref = getMeetingAccessHref(item.mode, access);
            const isSelected = item.id === selectedMeetingId;
            const isOverdue = isMeetingScheduleOverdue(item);

            return (
              <tr
                key={item.id}
                onClick={() => onView(item)}
                className={
                  isSelected
                    ? 'cursor-pointer border-l-4 border-[#003c90] bg-[#003c90]/5 transition-colors'
                    : isOverdue
                      ? 'cursor-pointer border-b border-[#eceef0] bg-[#ffdad6]/60 transition-colors hover:bg-[#ffdad6]/80'
                      : 'cursor-pointer border-b border-[#eceef0] transition-colors hover:bg-[#f2f4f6]'
                }
              >
                <td className={rowCellClassName}>
                  <span
                    className={`block font-semibold text-[#191c1e] ${meetingTableClampClassName.title}`}
                    title={item.companyName}
                  >
                    {item.companyName}
                  </span>
                  <span
                    className={`mt-0.5 block text-xs text-[#434653] ${meetingTableClampClassName.notes}`}
                    title={item.picName}
                  >
                    {item.picName}
                  </span>
                </td>
                <td className={`${rowCellClassName} font-semibold text-[#191c1e]`}>
                  <span className={meetingTableClampClassName.title} title={item.title}>
                    {item.title}
                  </span>
                </td>
                <td className={`${rowCellClassName} w-1 whitespace-nowrap`}>
                  <div className="inline-flex items-start gap-2">
                    {platformIcon(item.mode)}
                    {accessHref ? (
                      <a
                        href={accessHref}
                        target="_blank"
                        rel="noreferrer"
                        title={access}
                        onClick={(event) => event.stopPropagation()}
                        className="text-xs font-semibold text-[#003c90] underline-offset-2 hover:underline"
                      >
                        {modeLabel}
                      </a>
                    ) : (
                      <span className="text-xs text-[#434653]" title={access || undefined}>
                        {modeLabel}
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-0.5 text-xs leading-snug ${
                      isOverdue ? 'font-bold text-[#ba1a1a]' : 'text-[#434653]'
                    }`}
                  >
                    {dateLine}
                    {timeLine ? (
                      <>
                        {' '}
                        <span className={`text-[11px] ${isOverdue ? 'text-[#ba1a1a]' : 'text-[#434653]'}`}>
                          {timeLine}
                        </span>
                      </>
                    ) : null}
                  </p>
                </td>
                <td className={`${rowCellClassName} w-[180px] max-w-[180px] text-xs text-[#434653]`}>
                  <span className={meetingTableClampClassName.notes} title={item.notes || undefined}>
                    {item.notes || '-'}
                  </span>
                </td>
                <td className={`${rowCellClassName} text-xs text-[#434653]`}>
                  <span className={meetingTableClampClassName.notes} title={item.handledByName}>
                    {item.handledByName}
                  </span>
                </td>
                <td className={`${rowCellClassName} w-1 whitespace-nowrap text-right`}>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${meetingStatusClass(item.status)}`}
                  >
                    {meetingStatusLabel(item.status)}
                  </span>
                </td>
                <td className={`${rowCellClassName} w-1 whitespace-nowrap text-right`}>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${minutesStatusClass(item.hasMinutes)}`}
                  >
                    {minutesStatusLabel(item.hasMinutes)}
                  </span>
                </td>
                <td className={`${rowCellClassName} w-1 whitespace-nowrap text-right`}>
                  <div onClick={(event) => event.stopPropagation()}>
                    <MeetingsTableRowActions
                      item={item}
                      canMarkComplete={canMarkComplete}
                      onView={onView}
                      onMarkComplete={onMarkComplete}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    {footer}
  </div>
);
