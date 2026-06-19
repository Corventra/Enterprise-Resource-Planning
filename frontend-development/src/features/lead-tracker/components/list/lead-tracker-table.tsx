import type { ReactNode } from 'react';
import {
  leadStageLabelMap,
  leadStatusLabelMap,
  stageProgressLabelMap,
  type LeadPipelineStatus,
  type LeadTrackerItem
} from '../../types/lead-tracker.types';
import { isLeadDueDateOverdue } from '../../utils/lead-tracker-due-date';
import { getLeadPipelineProgressPercent } from '../../utils/lead-tracker-progress';
import { LeadTrackerTableRowActions } from './lead-tracker-table-row-actions';

interface LeadTrackerTableProps {
  items: LeadTrackerItem[];
  allowLeadManage?: boolean;
  currentUserId?: number | null;
  onView: (item: LeadTrackerItem) => void;
  onMarkLost: (item: LeadTrackerItem) => void;
  footer?: ReactNode;
}

const thBase =
  'border-none px-4 py-3 align-middle text-[11px] font-bold uppercase tracking-wider text-[#737784] first:pl-5 last:pr-5';

const formatDateTime = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

const leadStatusClass = (status: LeadPipelineStatus) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-[#d9e2ff] text-[#00419c]';
    case 'WON':
      return 'bg-[#4edea3]/25 text-[#004b31]';
    case 'LOST':
      return 'bg-[#e0e3e5] text-[#434653]';
    default:
      return 'bg-[#e0e3e5] text-[#434653]';
  }
};

export const LeadTrackerTable = ({
  items,
  allowLeadManage = false,
  currentUserId = null,
  onView,
  onMarkLost,
  footer
}: LeadTrackerTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]/80">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-none bg-[#eceef0]">
              <th className={`${thBase} text-left`}>Code</th>
              <th className={`${thBase} text-left`}>Company</th>
              <th className={`${thBase} text-left`}>Current Stage</th>
              <th className={`${thBase} text-left`}>Stage Progress</th>
              <th className={`${thBase} text-left`}>Processed By</th>
              <th className={`${thBase} text-left`}>Processed At</th>
              <th className={`${thBase} text-left`}>Next Action</th>
              <th className={`${thBase} text-left`}>Due Date</th>
              <th className={`${thBase} text-center`}>Lead Status</th>
              <th className={`${thBase} text-center`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {items.map((item) => {
              const progressPercent = getLeadPipelineProgressPercent(
                item.currentStage,
                item.stageProgress,
                item.leadStatus
              );
              const isOverdue = isLeadDueDateOverdue(item.dueDate);

              return (
                <tr
                  key={item.id}
                  className={`group transition-colors ${
                    isOverdue ? 'bg-[#ffdad6]/60 hover:bg-[#ffdad6]/80' : 'hover:bg-[#eceef0]/30'
                  }`}
                >
                <td className="py-3.5 pl-5 pr-4">
                  <p className="font-mono text-xs font-bold text-[#003c90]">{item.leadCode}</p>
                </td>
                <td className="py-3.5 pr-4">
                  <p className="text-sm font-bold text-[#191c1e] transition-colors group-hover:text-[#003c90]">
                    {item.companyName}
                  </p>
                </td>
                  <td className="px-4 py-3.5 align-middle">
                    <span className="inline-flex rounded-full bg-[#d9e2ff] px-3 py-1 text-[11px] font-bold text-[#00419c]">
                      {leadStageLabelMap[item.currentStage]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-32 rounded-full bg-[#e0e3e5]">
                        <div
                          className="h-2 rounded-full bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)]"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-sm font-semibold text-[#434653]">{progressPercent}%</p>
                    </div>
                    <p className="mt-1 text-xs font-bold text-[#434653]">
                      {stageProgressLabelMap[item.stageProgress] ?? item.stageProgress}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[#434653]">
                    {item.processedBy ? (
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#d9e2ff] text-[10px] font-bold text-[#00419c]">
                          {getInitials(item.processedBy)}
                        </span>
                        <span>{item.processedBy}</span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[#434653]">{formatDateTime(item.processedAt)}</td>
                  <td className="px-4 py-3.5 text-xs font-bold text-[#434653]">{item.nextAction ?? '—'}</td>
                  <td
                    className={`px-4 py-3.5 text-xs font-medium ${
                      isOverdue ? 'font-bold text-[#ba1a1a]' : 'text-[#434653]'
                    }`}
                  >
                    {formatDateTime(item.dueDate)}
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex justify-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${leadStatusClass(item.leadStatus)}`}
                      >
                        {leadStatusLabelMap[item.leadStatus]}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pl-4 pr-5 align-middle">
                    <LeadTrackerTableRowActions
                      allowMarkLost={
                        allowLeadManage &&
                        item.leadStatus === 'ACTIVE' &&
                        item.processedByUserId != null &&
                        currentUserId != null &&
                        item.processedByUserId === currentUserId
                      }
                      onView={() => onView(item)}
                      onMarkLost={() => onMarkLost(item)}
                    />
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
};
