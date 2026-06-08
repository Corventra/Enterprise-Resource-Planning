import type { KpiTrendData } from './analytics-shared';
import { CeoEmptyState } from '../ceo/ceo-dashboard-ui';

interface Props {
  data: KpiTrendData;
  /** Default: tampilkan total_score saja. 'dimensions' = stacked 4 dimensi bars. */
  mode?: 'total' | 'dimensions';
  /** Insight teks pendek di bawah chart. */
  caption?: string;
}

/**
 * KPI Trend Chart — bar chart 6 periode (atau N periode dari data).
 * Pure CSS bars sesuai pola existing (lihat payment-received-trend-chart).
 * - mode='total' (default): satu bar per periode (avg total_score)
 * - mode='dimensions': stacked grup 4 bar kecil (TC/TM/UC/OQ)
 */
export const KpiTrendChart = ({ data, mode = 'total', caption }: Props) => {
  const points = data?.points ?? [];
  const hasAnyData = points.some((p) => p.sample_size > 0);

  if (points.length === 0 || !hasAnyData) {
    return (
      <CeoEmptyState
        message="Belum ada data KPI di 6 periode terakhir."
        hint="Trend akan muncul setelah CEO finalize period KPI minimal sekali."
      />
    );
  }

  const axisMax = 100;
  const plotPx = 140;
  const barHeight = (v: number) => (v > 0 ? Math.max((v / axisMax) * plotPx, 4) : 0);

  return (
    <div className="space-y-3">
      <div className="flex gap-2.5 pl-0 sm:gap-3">
        <div
          className="flex w-8 shrink-0 flex-col justify-between text-right text-[10px] text-[#9ca3af] sm:w-9"
          style={{ height: plotPx }}
        >
          {[100, 70, 0].map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            <div className="border-t border-dashed border-[#e4e7ec]" />
            <div className="border-t border-dashed border-[#fde8b0]" title="Threshold 70 (Good)" />
            <div className="border-t border-[#e4e7ec]" />
          </div>
          <div className="flex items-end justify-between gap-2 sm:gap-3" style={{ height: plotPx }}>
            {points.map((p) => {
              if (mode === 'dimensions') {
                const dims = [
                  { val: p.task_completion, color: 'bg-[#003c90]', label: 'TC' },
                  { val: p.timeliness, color: 'bg-[#0f52ba]', label: 'TM' },
                  { val: p.update_compliance, color: 'bg-[#737784]', label: 'UC' },
                  { val: p.output_quality, color: 'bg-[#006544]', label: 'OQ' }
                ];
                return (
                  <div key={p.period} className="flex min-w-0 flex-1 items-end justify-center gap-0.5">
                    {dims.map((d) => (
                      <div
                        key={`${p.period}-${d.label}`}
                        className={`w-[6px] shrink-0 rounded-t-sm sm:w-[7px] ${d.color}`}
                        style={{ height: barHeight(d.val) }}
                        title={`${p.label} · ${d.label}: ${d.val.toFixed(1)}`}
                      />
                    ))}
                  </div>
                );
              }
              return (
                <div key={p.period} className="flex min-w-0 flex-1 flex-col items-center">
                  <div
                    className="w-[11px] shrink-0 rounded-t-md bg-[#003c90] sm:w-[13px]"
                    style={{ height: barHeight(p.total_score) }}
                    title={`${p.label}: ${p.total_score.toFixed(1)} (n=${p.sample_size})`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex gap-2 pl-8 sm:gap-3 sm:pl-9">
        {points.map((p) => (
          <p key={`${p.period}-lbl`} className="min-w-0 flex-1 truncate text-center text-[10px] font-medium text-[#737784]">
            {p.label}
          </p>
        ))}
      </div>
      {mode === 'dimensions' && (
        <div className="flex flex-wrap justify-center gap-3 text-[10px] text-[#434653]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#003c90]" /> Task Completion
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#0f52ba]" /> Timeliness
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#737784]" /> Update Compliance
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#006544]" /> Output Quality
          </span>
        </div>
      )}
      {caption ? (
        <p className="rounded-lg bg-[#f8f9fb] px-3 py-2 text-xs leading-relaxed text-[#434653]">{caption}</p>
      ) : null}
    </div>
  );
};
