import { Info } from 'lucide-react';
import type { LeadWorkspaceEngagementLetterItem } from '../types/lead-workspace.types';

interface EngagementLetterInfoCardProps {
  engagementLetter?: LeadWorkspaceEngagementLetterItem;
}

const formatDateTime = (iso?: string) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const EngagementLetterInfoCard = ({ engagementLetter }: EngagementLetterInfoCardProps) => {
  if (!engagementLetter) {
    return (
      <div className="rounded-xl bg-white p-6 text-sm text-[#737784] shadow-sm ring-1 ring-[#eceef0]">
        Select an engagement letter.
      </div>
    );
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0]">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-[#191c1e]">
          <Info className="h-5 w-5 text-[#003c90]" />
          Engagement Letter Info
        </h3>
        <span className="rounded-full bg-[#003c90]/10 px-3 py-1 text-xs font-bold text-[#003c90]">
          ID: {engagementLetter.id.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Nama Layanan</p>
          <p className="mt-1 text-sm font-semibold text-[#191c1e]">{engagementLetter.serviceName}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Agree Fee (Final)</p>
          <p className="mt-1 text-sm font-bold text-[#004b31]">{engagementLetter.agreeFee}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Payment Type Final</p>
          <p className="mt-1 text-sm font-semibold text-[#191c1e]">{engagementLetter.paymentTypeFinal}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Has Subcon</p>
          <p className="mt-1 text-sm font-semibold text-[#191c1e]">{engagementLetter.hasSubcon ? 'With Subcontractor' : 'No Subcontractor'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Created Date</p>
          <p className="mt-1 text-sm font-semibold text-[#191c1e]">{formatDateTime(engagementLetter.createdAt)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Signed Date</p>
          <p className="mt-1 text-sm font-semibold text-[#191c1e]">{formatDateTime(engagementLetter.signedAt)}</p>
        </div>
      </div>
    </section>
  );
};
