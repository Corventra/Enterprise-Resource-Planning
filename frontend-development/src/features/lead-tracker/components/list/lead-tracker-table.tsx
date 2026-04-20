import { Eye } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  leadStageLabelMap,
  stageProgressOrderMap,
  type LeadTrackerItem
} from '../../types/lead-tracker.types';

interface LeadTrackerTableProps {
  items: LeadTrackerItem[];
  onView: (item: LeadTrackerItem) => void;
  footer?: ReactNode;
}

const thBase =
  'border-none px-4 py-3 align-middle text-[11px] font-bold uppercase tracking-wider text-[#737784] first:pl-5 last:pr-5';

const formatDateTime = (iso: string) => {
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

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

const getStageProgressPercent = (item: LeadTrackerItem) => {
  const order = stageProgressOrderMap[item.currentStage] as readonly string[];
  const index = order.indexOf(item.stageProgress as string);
  if (index < 0 || order.length <= 1) {
    return 0;
  }
  return Math.round((index / (order.length - 1)) * 100);
};

export const LeadTrackerTable = ({ items, onView, footer }: LeadTrackerTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]/80">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-none bg-[#eceef0]">
              <th className={`${thBase} text-left`}>Company</th>
              <th className={`${thBase} text-left`}>Current Stage</th>
              <th className={`${thBase} text-left`}>Stage Progress</th>
              <th className={`${thBase} text-left`}>Processed By</th>
              <th className={`${thBase} text-left`}>Processed At</th>
              <th className={`${thBase} text-left`}>Next Action</th>
              <th className={`${thBase} text-left`}>Due Date</th>
              <th className={`${thBase} text-center`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {items.map((item) => (
              <tr key={item.id} className="group transition-colors hover:bg-[#eceef0]/30">
                <td className="py-3.5 pl-5 pr-4">
                  <p className="text-sm font-bold text-[#191c1e] transition-colors group-hover:text-[#003c90]">
                    {item.company}
                  </p>
                </td>
                <td className="px-4 py-3.5 text-xs font-bold text-[#434653]">{leadStageLabelMap[item.currentStage]}</td>
                <td className="px-4 py-3.5">
                  {/** Stage progress derives from allowed sequence per stage */ }
                  <div className="flex items-center gap-2.5">
                    <div className="w-32 rounded-full bg-[#e0e3e5]">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)]"
                        style={{ width: `${getStageProgressPercent(item)}%` }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-[#434653]">{getStageProgressPercent(item)}%</p>
                  </div>
                  <p className="text-xs font-bold text-[#434653]">{item.stageProgress}</p>
                </td>
                <td className="px-4 py-3.5 text-xs text-[#434653]">
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#d9e2ff] text-[10px] font-bold text-[#00419c]">
                      {getInitials(item.processedBy)}
                    </span>
                    <span>{item.processedBy}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-[#434653]">{formatDateTime(item.processedAt)}</td>
                <td className="px-4 py-3.5 text-xs font-bold text-[#434653]">{item.nextAction}</td>
                <td className="px-4 py-3.5 text-xs font-medium text-[#434653]">{formatDate(item.dueDate)}</td>
                <td className="py-3.5 pl-4 pr-5 align-middle">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onView(item)}
                      className="inline-flex text-[#737784] transition-colors hover:text-[#003c90] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d59c1]/40"
                      aria-label="View lead"
                    >
                      <Eye className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
};
