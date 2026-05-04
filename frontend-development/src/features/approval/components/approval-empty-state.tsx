import { CheckCircle2 } from 'lucide-react';

interface ApprovalEmptyStateProps {
  onReset?: () => void;
}

export const ApprovalEmptyState = ({ onReset }: ApprovalEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-[#eceef0]">
      <span className="rounded-full bg-[#4edea3]/20 p-3">
        <CheckCircle2 className="h-7 w-7 text-[#006544]" strokeWidth={2} />
      </span>
      <h3 className="text-lg font-semibold text-[#191c1e]">All caught up</h3>
      <p className="max-w-md text-sm text-[#737784]">
        Tidak ada item yang menunggu approval saat ini. Semua submission sudah di-review.
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-2 inline-flex items-center rounded-lg bg-[#003c90] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0f52ba]"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
};
