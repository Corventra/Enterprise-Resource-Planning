import type { ProjectVelocityData } from './analytics-shared';
import { CeoEmptyState } from '../ceo/ceo-dashboard-ui';

interface Props {
  data: ProjectVelocityData;
}

/**
 * Project Velocity Chart — paired bar (created vs completed) per bulan.
 */
export const ProjectVelocityChart = ({ data }: Props) => {
  const points = data?.points ?? [];
  const hasData = points.some((p) => p.created > 0 || p.completed > 0);
  if (points.length === 0 || !hasData) {
    return <CeoEmptyState message="Belum ada data project di 6 bulan terakhir." />;
  }

  const rawMax = Math.max(...points.flatMap((p) => [p.created, p.completed]), 1);
  // Nice round-up
  const niceSteps = [1, 2, 5, 10, 20, 50, 100, 200, 500];
  const axisMax = niceSteps.find((s) => s >= rawMax) ?? rawMax;
  const plotPx = 140;
  const h = (v: number) => (v > 0 ? Math.max((v / axisMax) * plotPx, 3) : 0);

  return (
    <div className="space-y-3">
      <div className="flex gap-2.5 pl-0 sm:gap-3">
        <div
          className="flex w-6 shrink-0 flex-col justify-between text-right text-[10px] text-[#9ca3af]"
          style={{ height: plotPx }}
        >
          {[axisMax, Math.round(axisMax / 2), 0].map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            <div className="border-t border-dashed border-[#e4e7ec]" />
            <div className="border-t border-dashed border-[#e4e7ec]" />
            <div className="border-t border-[#e4e7ec]" />
          </div>
          <div className="flex items-end justify-between gap-2 sm:gap-3" style={{ height: plotPx }}>
            {points.map((p) => (
              <div key={p.period} className="flex min-w-0 flex-1 items-end justify-center gap-1">
                <div
                  className="w-[10px] shrink-0 rounded-t-sm bg-[#8a6d00] sm:w-[12px]"
                  style={{ height: h(p.created) }}
                  title={`${p.label} · Created: ${p.created}`}
                />
                <div
                  className="w-[10px] shrink-0 rounded-t-sm bg-[#006544] sm:w-[12px]"
                  style={{ height: h(p.completed) }}
                  title={`${p.label} · Completed: ${p.completed}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 pl-6 sm:gap-3">
        {points.map((p) => (
          <p key={`${p.period}-lbl`} className="min-w-0 flex-1 truncate text-center text-[10px] font-medium text-[#737784]">
            {p.label}
          </p>
        ))}
      </div>
      <div className="flex justify-center gap-4 text-[10px] text-[#434653]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-[#8a6d00]" /> Created
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-[#006544]" /> Completed
        </span>
      </div>
    </div>
  );
};
