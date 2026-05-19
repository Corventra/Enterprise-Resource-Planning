import { Plus } from 'lucide-react';

interface FormEmptyStateProps {
  onCreate?: () => void;
}

export const FormEmptyState = ({ onCreate }: FormEmptyStateProps) => {
  return (
    <div className="rounded-xl border border-dashed border-[#c3c6d5] bg-white p-7 text-center shadow-sm">
      <h3 className="text-sm font-semibold text-[#191c1e]">No forms found</h3>
      <p className="mt-1.5 text-xs text-[#737784] sm:text-sm">
        {onCreate
          ? 'Create a form for this campaign to start collecting submissions.'
          : 'No forms are available for this campaign.'}
      </p>
      {onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Create Form
        </button>
      ) : null}
    </div>
  );
};
