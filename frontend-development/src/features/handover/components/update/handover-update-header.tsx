interface HandoverUpdateHeaderProps {
  onBack: () => void;
}

export const HandoverUpdateHeader = ({ onBack }: HandoverUpdateHeaderProps) => {
  const actionClass =
    'inline-flex items-center gap-2 rounded-lg bg-[#f2f4f6] px-4 py-2.5 text-sm font-semibold text-[#191c1e] transition-colors hover:bg-[#e6e8ea]';

  return (
    <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black">Update Handover</h1>
        <p className="mt-1 text-sm text-[#737784]">Edit memo handover proyek secara lengkap.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onBack} className={actionClass}>
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Back
        </button>
        <button
          type="button"
          className={actionClass}
        >
          Save as Draft
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[20px]">save</span>
          Submit Handover
        </button>
      </div>
    </header>
  );
};
