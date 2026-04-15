interface CampaignEmptyStateProps {
  onCreate: () => void;
}

export const CampaignEmptyState = ({ onCreate }: CampaignEmptyStateProps) => {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h3 className="text-base font-semibold text-slate-900">No campaigns found</h3>
      <p className="mt-2 text-sm text-slate-500">
        Try changing your filters, or create a new campaign to start collecting submissions.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Create Campaign
      </button>
    </div>
  );
};
