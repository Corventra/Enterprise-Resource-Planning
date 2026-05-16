import { Eye, XCircle } from 'lucide-react';

interface LeadTrackerTableRowActionsProps {
  allowMarkLost: boolean;
  onView: () => void;
  onMarkLost: () => void;
}

const baseBtn =
  'inline-flex text-[#737784] transition-colors hover:text-[#003c90] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d59c1]/40';

export const LeadTrackerTableRowActions = ({
  allowMarkLost,
  onView,
  onMarkLost
}: LeadTrackerTableRowActionsProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <button type="button" className={baseBtn} onClick={onView} aria-label="View lead" title="View">
        <Eye className="h-4 w-4" strokeWidth={2} />
      </button>
      {allowMarkLost ? (
        <button
          type="button"
          className="inline-flex text-[#737784] transition-colors hover:text-[#ba1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200"
          onClick={onMarkLost}
          aria-label="Mark lead as lost"
          title="Mark as Lost"
        >
          <XCircle className="h-4 w-4" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
};
