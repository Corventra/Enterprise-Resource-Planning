interface ApprovalEmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
  resetLabel?: string;
}

const DEFAULT_TITLE = 'No approval items found';
const DEFAULT_DESCRIPTION = 'There are no submissions waiting for review at this time.';
const FILTERED_DESCRIPTION = 'Try adjusting your search or reset filters to show the approval queue.';

export const ApprovalEmptyState = ({
  title = DEFAULT_TITLE,
  description,
  onReset,
  resetLabel = 'Reset Filters'
}: ApprovalEmptyStateProps) => {
  const body = description ?? (onReset ? FILTERED_DESCRIPTION : DEFAULT_DESCRIPTION);

  return (
    <div className="rounded-xl border border-dashed border-[#c3c6d5] bg-white p-7 text-center shadow-sm">
      <h3 className="text-sm font-semibold text-[#191c1e]">{title}</h3>
      <p className="mt-1.5 text-xs text-[#737784] sm:text-sm">{body}</p>
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90"
        >
          {resetLabel}
        </button>
      ) : null}
    </div>
  );
};
