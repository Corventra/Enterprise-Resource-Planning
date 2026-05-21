import type { PipelineDocumentTrendPoint } from '../../types/pipeline-analytics.types';
import { formatDashboardNumber } from '../../utils/format-dashboard';

interface PipelineDocumentTrendChartProps {
  points: PipelineDocumentTrendPoint[];
  compact?: boolean;
}

const COLORS = {
  proposals: 'repeating-linear-gradient(135deg, #c5d9f5 0, #c5d9f5 4px, #9bb8e8 4px, #9bb8e8 8px)',
  el_signed: '#0f52ba',
  handover: '#006544'
};

const niceMax = (value: number) => {
  if (value <= 0) return 4;
  if (value <= 10) return 10;
  if (value <= 20) return 20;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
};

export const PipelineDocumentTrendChart = ({ points, compact = false }: PipelineDocumentTrendChartProps) => {
  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-[#737784]">Belum ada data tren dokumen.</p>;
  }

  const visible = points.slice(-6);
  const rawMax = Math.max(...visible.flatMap((p) => [p.proposals, p.el_signed, p.handover_approved]), 0);
  const axisMax = niceMax(rawMax);
  const plotPx = compact ? 100 : 140;
  const barW = compact ? 'w-[7px] sm:w-[8px]' : 'w-[9px] sm:w-[11px]';

  const barHeight = (value: number) => (value > 0 ? Math.max((value / axisMax) * plotPx, 5) : 0);

  const legend = (
    <div
      className={`flex flex-wrap gap-3 text-[#434653] ${compact ? 'gap-2 text-[10px]' : 'justify-center gap-4 text-xs'}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-4 rounded-sm" style={{ background: COLORS.proposals }} /> Proposal
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-4 rounded-sm bg-[#0f52ba]" /> EL Signed
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-4 rounded-sm bg-[#006544]" /> Handover
      </span>
    </div>
  );

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex gap-2.5 pl-0 sm:gap-3">
        <div
          className="flex w-8 shrink-0 flex-col justify-between text-right text-[10px] text-[#9ca3af] sm:w-9"
          style={{ height: plotPx }}
        >
          {[axisMax, Math.round(axisMax / 2), 0].map((tick) => (
            <span key={tick}>{formatDashboardNumber(tick)}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            <div className="border-t border-dashed border-[#e4e7ec]" />
            <div className="border-t border-dashed border-[#e4e7ec]" />
            <div className="border-t border-[#e4e7ec]" />
          </div>
          <div className="flex items-end justify-between gap-2 sm:gap-3" style={{ height: plotPx }}>
            {visible.map((point) => (
              <div key={point.month} className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex items-end gap-0.5 sm:gap-1">
                  <div
                    className={`${barW} shrink-0 rounded-t-md`}
                    style={{ height: barHeight(point.proposals), background: COLORS.proposals }}
                    title={`Proposal: ${point.proposals}`}
                  />
                  <div
                    className={`${barW} shrink-0 rounded-t-md bg-[#0f52ba]`}
                    style={{ height: barHeight(point.el_signed) }}
                    title={`EL: ${point.el_signed}`}
                  />
                  <div
                    className={`${barW} shrink-0 rounded-t-md bg-[#006544]`}
                    style={{ height: barHeight(point.handover_approved) }}
                    title={`Handover: ${point.handover_approved}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 pl-8 sm:gap-3 sm:pl-9">
        {visible.map((point) => (
          <p key={`${point.month}-lbl`} className="min-w-0 flex-1 truncate text-center text-[10px] font-medium text-[#737784]">
            {point.label}
          </p>
        ))}
      </div>
      {legend}
    </div>
  );
};
