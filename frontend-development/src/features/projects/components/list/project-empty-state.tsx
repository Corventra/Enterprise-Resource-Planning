import { Briefcase } from 'lucide-react';

interface ProjectEmptyStateProps {
  onReset?: () => void;
  /** Tailored copy depending on whether scope is empty due to filters or due to role scope. */
  reason?: 'filters' | 'role-scope';
}

export const ProjectEmptyState = ({ onReset, reason = 'filters' }: ProjectEmptyStateProps) => {
  const copy =
    reason === 'role-scope'
      ? 'Belum ada project yang di-assign ke Anda. Hubungi PM atau COO Anda untuk penugasan.'
      : 'Tidak ada project yang cocok dengan filter saat ini. Reset filter untuk melihat semua project.';

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-[#eceef0]">
      <span className="rounded-full bg-[#003c90]/10 p-3">
        <Briefcase className="h-7 w-7 text-[#003c90]" strokeWidth={2} />
      </span>
      <h3 className="text-lg font-semibold text-[#191c1e]">No projects found</h3>
      <p className="max-w-md text-sm text-[#737784]">{copy}</p>
      {onReset && reason === 'filters' && (
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
