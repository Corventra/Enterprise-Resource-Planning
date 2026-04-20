import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import type { Campaign } from '../../types/campaign.types';

interface CampaignDetailVisualPanelProps {
  campaign: Campaign;
}

const fallbackImage = (campaignId: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(campaignId)}/800/960`;

const insightSnippet = (notes: string | undefined, maxLen = 120) => {
  const t = notes?.trim();
  if (!t) return 'Align outreach, forms, and submissions in one place for this initiative.';
  return t.length > maxLen ? `${t.slice(0, maxLen).trim()}…` : t;
};

export const CampaignDetailVisualPanel = ({ campaign }: CampaignDetailVisualPanelProps) => {
  const [imageBroken, setImageBroken] = useState(false);
  const src = campaign.coverImageUrl?.trim() || fallbackImage(campaign.id);

  return (
    <aside className="group relative flex min-h-[240px] flex-1 overflow-hidden rounded-2xl bg-[#eceef0] shadow-sm ring-1 ring-[#eceef0] sm:min-h-[280px] lg:min-h-[min(100%,22rem)] lg:sticky lg:top-4">
      {!imageBroken ? (
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={() => setImageBroken(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#003c90] to-[#0f52ba]">
          <Megaphone className="h-14 w-14 text-white/90" strokeWidth={1.25} />
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#003c90]/88 via-[#003c90]/25 to-transparent"
        aria-hidden
      />

      <div className="relative mt-auto flex flex-col justify-end p-4 text-white sm:p-5">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] opacity-85">Campaign focus</p>
        <h3 className="text-base font-bold leading-snug sm:text-lg">{campaign.topic}</h3>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/90">{insightSnippet(campaign.notes)}</p>
      </div>
    </aside>
  );
};
