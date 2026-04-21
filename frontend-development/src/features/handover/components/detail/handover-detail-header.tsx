interface HandoverDetailHeaderProps {
  onBack: () => void;
}

export const HandoverDetailHeader = ({ onBack }: HandoverDetailHeaderProps) => {
  const actionClass =
    'inline-flex items-center gap-2 rounded-lg bg-[#f2f4f6] px-4 py-2.5 text-sm font-semibold text-[#191c1e] transition-colors hover:bg-[#e6e8ea]';

  return (
    <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#003c90]">Handover Detail</h1>
        <p className="mt-1 text-sm text-[#737784]">Menampilkan memo handover proyek secara lengkap.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onBack} className={actionClass}>
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Back
        </button>
        <button type="button" className={actionClass}>
          <span className="material-symbols-outlined text-[20px]">print</span>
          Print
        </button>
        <button type="button" className={actionClass}>
          <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
          PDF
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[20px]">edit</span>
          Edit Handover
        </button>
      </div>
    </header>
  );
};
