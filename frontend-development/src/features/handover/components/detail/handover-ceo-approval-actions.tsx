interface HandoverCeoApprovalActionsProps {
  disabled?: boolean;
  embedded?: boolean;
  onApprove: () => void;
  onReject: () => void;
}

const PRIMARY =
  'inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:opacity-50';
const SECONDARY =
  'inline-flex items-center gap-2 rounded-lg border border-[#c3c6d5] bg-white px-5 py-2.5 text-sm font-semibold text-[#191c1e] transition-colors hover:bg-[#f2f4f6] disabled:opacity-50';

export const HandoverCeoApprovalActions = ({
  disabled = false,
  embedded = false,
  onApprove,
  onReject,
}: HandoverCeoApprovalActionsProps) => {
  const content = (
    <>
      <p className="text-sm font-semibold text-[#191c1e]">Keputusan CEO</p>
      <p className="mt-1 text-sm text-[#737784]">Handover ini menunggu persetujuan Anda.</p>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" disabled={disabled} onClick={onReject} className={SECONDARY}>
          <span className="material-symbols-outlined text-[20px]">undo</span>
          Tolak / Minta Revisi
        </button>
        <button type="button" disabled={disabled} onClick={onApprove} className={PRIMARY}>
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          Approve Handover
        </button>
      </div>
    </>
  );

  if (embedded) {
    return <div className="mt-6 border-t border-[#f2f4f6] pt-6">{content}</div>;
  }

  return (
    <section className="rounded-xl border border-[#eceef0] bg-white p-5 shadow-sm ring-1 ring-[#eceef0]">
      {content}
    </section>
  );
};
