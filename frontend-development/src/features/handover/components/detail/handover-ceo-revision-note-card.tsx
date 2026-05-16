interface HandoverCeoRevisionNoteCardProps {
  note?: string | null;
}

export const HandoverCeoRevisionNoteCard = ({ note }: HandoverCeoRevisionNoteCardProps) => {
  const text = note?.trim() ? note.trim() : '—';

  return (
    <section className="rounded-xl border border-orange-200 bg-orange-50/80 p-5 shadow-sm ring-1 ring-orange-100">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined shrink-0 text-2xl text-[#c2410c]">rate_review</span>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#c2410c]">Catatan Revisi CEO</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#7c2d12]">{text}</p>
        </div>
      </div>
    </section>
  );
};
