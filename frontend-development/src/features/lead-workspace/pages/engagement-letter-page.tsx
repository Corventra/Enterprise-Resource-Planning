import { ScrollText } from 'lucide-react';
import { useOutletContext } from 'react-router';
import type { LeadWorkspaceOutletContext } from './lead-workspace-page';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const EngagementLetterPage = () => {
  const { workspace } = useOutletContext<LeadWorkspaceOutletContext>();
  const engagementLetter = workspace.engagementLetter;

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Engagement Letter</p>
          <h3 className="mt-1 text-xl font-bold text-[#191c1e]">{engagementLetter.status}</h3>
        </div>
        <ScrollText className="h-5 w-5 text-[#003c90]" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-[#f2f4f6] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#737784]">Owner</p>
          <p className="mt-1 text-sm font-semibold text-[#191c1e]">{engagementLetter.owner}</p>
        </div>
        <div className="rounded-lg bg-[#f2f4f6] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#737784]">Last Updated</p>
          <p className="mt-1 text-sm font-semibold text-[#191c1e]">{formatDate(engagementLetter.lastUpdatedAt)}</p>
        </div>
        <div className="rounded-lg bg-[#f2f4f6] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#737784]">Notes</p>
          <p className="mt-1 text-sm text-[#434653]">{engagementLetter.notes}</p>
        </div>
      </div>
    </section>
  );
};
