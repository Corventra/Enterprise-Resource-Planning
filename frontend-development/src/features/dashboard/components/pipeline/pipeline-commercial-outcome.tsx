import { BadgeCheck } from 'lucide-react';
import type { PipelineCommercialOutcome as PipelineCommercialOutcomeData } from '../../types/pipeline-analytics.types';
import { formatDashboardNumber, formatDashboardPercent } from '../../utils/format-dashboard';
import { ceoPanelClass } from '../ceo/ceo-dashboard-ui';

interface PipelineCommercialOutcomeProps {
  outcome: PipelineCommercialOutcomeData;
}

export const PipelineCommercialOutcome = ({ outcome }: PipelineCommercialOutcomeProps) => (
  <article className={`${ceoPanelClass} flex h-full flex-col`}>
    <div className="mb-5 flex items-start justify-between gap-3 border-b border-[#eceef0] pb-3">
      <div>
        <h3 className="text-sm font-bold text-[#191c1e]">Hasil Komersial</h3>
        <p className="mt-0.5 text-xs text-[#737784]">Won = EL Signed · periode aktif</p>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2f4f6] text-[#737784]">
        <BadgeCheck className="h-5 w-5" strokeWidth={2} />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-6 px-1">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#737784]">Deal Berhasil</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-[#003c90] sm:text-4xl">
          {formatDashboardNumber(outcome.won)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#737784]">Deal Gagal</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-[#434653] sm:text-4xl">
          {formatDashboardNumber(outcome.lost)}
        </p>
      </div>
    </div>

    <div className="mt-auto rounded-2xl bg-gradient-to-r from-[#003c90] to-[#0f52ba] px-6 py-5 text-center shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/90">Win Rate</p>
      <p className="mt-1 text-4xl font-bold tracking-tight text-white sm:text-[2.75rem]">
        {formatDashboardPercent(outcome.win_rate)}
      </p>
      <p className="mt-1 text-[10px] text-white/75">{outcome.win_rate_label}</p>
    </div>
  </article>
);
