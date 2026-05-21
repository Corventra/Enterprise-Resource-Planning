import { formatDashboardNumber } from '../../utils/format-dashboard';

export interface SubmissionVsLeadPoint {
  label: string;
  submissions: number;
  leads: number;
}

interface SubmissionVsLeadChartProps {
  points: SubmissionVsLeadPoint[];
  compact?: boolean;
}

const SUBMISSION_FILL = 'repeating-linear-gradient(135deg, #c5d9f5 0, #c5d9f5 4px, #9bb8e8 4px, #9bb8e8 8px)';
const LEAD_FILL = '#003c90';

const niceMax = (value: number) => {
  if (value <= 0) return 4;
  if (value <= 4) return 4;
  if (value <= 10) return 10;
  if (value <= 20) return 20;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
};

const yTicks = (max: number, count = 4) => {
  const step = max / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(max - step * i));
};

interface GroupedBarProps {
  value: number;
  max: number;
  plotPx: number;
  widthClass: string;
  fill: string;
}

const GroupedBar = ({ value, max, plotPx, widthClass, fill }: GroupedBarProps) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const heightPx = value > 0 ? Math.max((pct / 100) * plotPx, 5) : 0;

  return (
    <div
      className={`${widthClass} shrink-0 rounded-t-lg transition-[height] duration-300`}
      style={{ height: heightPx, background: fill }}
      title={formatDashboardNumber(value)}
    />
  );
};

export const SubmissionVsLeadChart = ({ points, compact = true }: SubmissionVsLeadChartProps) => {
  if (points.length === 0) {
    return <p className="py-6 text-center text-xs text-[#737784]">Belum ada data lead capture.</p>;
  }

  const visiblePoints = points.slice(-6);
  const rawMax = Math.max(...visiblePoints.flatMap((p) => [p.submissions, p.leads]), 0);
  const axisMax = niceMax(rawMax);
  const ticks = yTicks(axisMax);
  const plotPx = compact ? 124 : 180;
  const barW = compact ? 'w-[11px] sm:w-[14px]' : 'w-[16px]';
  const groupGap = compact ? 'gap-1' : 'gap-1.5';
  const columnGap = compact ? 'gap-2.5 sm:gap-4' : 'gap-5';

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex gap-2.5 sm:gap-3">
        <div className="flex w-8 shrink-0 flex-col justify-between py-0.5 text-right sm:w-9" style={{ height: plotPx }}>
          {ticks.map((tick) => (
            <span key={tick} className="text-[10px] leading-none text-[#9ca3af] sm:text-[11px]">
              {formatDashboardNumber(tick)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {ticks.map((tick) => (
              <div key={`grid-${tick}`} className="border-t border-dashed border-[#e4e7ec]" />
            ))}
          </div>

          <div className={`relative flex items-end justify-between ${columnGap}`} style={{ height: plotPx }}>
            {visiblePoints.map((point) => (
              <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center">
                <div className={`flex items-end ${groupGap}`}>
                  <GroupedBar
                    value={point.submissions}
                    max={axisMax}
                    plotPx={plotPx}
                    widthClass={barW}
                    fill={SUBMISSION_FILL}
                  />
                  <GroupedBar value={point.leads} max={axisMax} plotPx={plotPx} widthClass={barW} fill={LEAD_FILL} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-0 h-px bg-[#e4e7ec]" />
        </div>
      </div>

      <div className="flex gap-2.5 pl-10 sm:gap-4 sm:pl-11">
        {visiblePoints.map((point) => (
          <p
            key={`${point.label}-x`}
            className="min-w-0 flex-1 truncate text-center text-[11px] font-medium text-[#737784] sm:text-xs"
          >
            {point.label}
          </p>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 border-t border-[#f0f2f5] pt-3.5">
        <span className="inline-flex items-center gap-2 text-xs text-[#434653]">
          <span className="h-3.5 w-5 rounded-sm" style={{ background: SUBMISSION_FILL }} aria-hidden />
          Submission lead capture
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-[#434653]">
          <span className="h-3.5 w-5 rounded-sm bg-[#003c90]" aria-hidden />
          Lead terbentuk
        </span>
      </div>
    </div>
  );
};
