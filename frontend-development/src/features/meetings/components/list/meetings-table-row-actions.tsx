import { CheckCircle2, Eye } from 'lucide-react';
import type { MeetingMonitorItem } from '../../types/meetings.types';

interface MeetingsTableRowActionsProps {
  item: MeetingMonitorItem;
  canMarkComplete: boolean;
  onView: (item: MeetingMonitorItem) => void;
  onMarkComplete: (item: MeetingMonitorItem) => void;
}

const actionIconClassName =
  'inline-flex rounded-lg p-1.5 text-[#737784] transition-colors hover:bg-[#f2f4f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d59c1]/40 disabled:opacity-50';

export const MeetingsTableRowActions = ({
  item,
  canMarkComplete,
  onView,
  onMarkComplete
}: MeetingsTableRowActionsProps) => {
  const showMarkDone = canMarkComplete && item.status === 'SCHEDULED';

  return (
    <div className="inline-flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onView(item)}
        className={`${actionIconClassName} hover:text-[#003c90]`}
        aria-label="Lihat detail"
      >
        <Eye className="h-4 w-4" strokeWidth={2} />
      </button>
      {showMarkDone ? (
        <button
          type="button"
          onClick={() => onMarkComplete(item)}
          className={`${actionIconClassName} hover:text-[#006544]`}
          aria-label="Tandai meeting selesai"
        >
          <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
        </button>
      ) : (
        <span className="inline-flex w-7 justify-center text-xs text-[#737784]">-</span>
      )}
    </div>
  );
};
