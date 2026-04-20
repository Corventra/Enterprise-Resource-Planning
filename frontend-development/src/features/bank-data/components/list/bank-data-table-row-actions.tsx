import { Archive, CheckCircle2, Eye } from 'lucide-react';

interface BankDataTableRowActionsProps {
  onView: () => void;
  onProcess: () => void;
  onArchive: () => void;
  canProcess: boolean;
  canArchive: boolean;
}

const baseBtn =
  'inline-flex text-[#737784] transition-colors hover:text-[#003c90] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d59c1]/40 disabled:opacity-35 disabled:pointer-events-none';

export const BankDataTableRowActions = ({
  onView,
  onProcess,
  onArchive,
  canProcess,
  canArchive
}: BankDataTableRowActionsProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <button type="button" className={baseBtn} onClick={onView} aria-label="View entry" title="View">
        <Eye className="h-4 w-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        className={baseBtn}
        onClick={onProcess}
        disabled={!canProcess}
        aria-label="Process entry"
        title="Process"
      >
        <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        className="inline-flex text-[#737784] transition-colors hover:text-[#ba1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200 disabled:opacity-35 disabled:pointer-events-none"
        onClick={onArchive}
        disabled={!canArchive}
        aria-label="Archive entry"
        title="Archive"
      >
        <Archive className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
};
