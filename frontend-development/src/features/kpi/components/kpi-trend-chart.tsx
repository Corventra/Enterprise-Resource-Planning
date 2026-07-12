import type { KpiSnapshot } from '../types/kpi.types';

interface KpiTrendChartProps {
  snapshots: KpiSnapshot[];
}

const WIDTH = 600;
const HEIGHT = 200;
const PADDING = { top: 20, right: 20, bottom: 30, left: 40 };

export const KpiTrendChart = ({ snapshots }: KpiTrendChartProps) => {
  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#eceef0] bg-[#f9fafb] px-6 py-10 text-center">
        <p className="text-sm font-semibold text-[#191c1e]">Belum ada data trend</p>
        <p className="max-w-md text-xs text-[#737784]">
          Snapshot historis akan tampil di sini setelah period berikutnya di-finalize.
        </p>
      </div>
    );
  }

  const sorted = [...snapshots].sort((a, b) => a.period.localeCompare(b.period));
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const xStep = sorted.length === 1 ? 0 : innerWidth / (sorted.length - 1);

  const points = sorted.map((snap, idx) => {
    const x = PADDING.left + idx * xStep;
    const y = PADDING.top + (1 - snap.total / 100) * innerHeight;
    return { x, y, snap };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#eceef0]">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h3 className="text-base font-bold text-[#191c1e]">KPI Trend</h3>
          <p className="text-xs text-[#737784]">Total KPI per period (lebih tinggi = lebih baik).</p>
        </div>
        <p className="text-xs font-medium text-[#737784]">{sorted.length} period{sorted.length === 1 ? '' : 's'}</p>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
        {/* Grid + Y axis labels */}
        {yTicks.map((tick) => {
          const y = PADDING.top + (1 - tick / 100) * innerHeight;
          return (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke="#eceef0"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 6}
                y={y + 3}
                textAnchor="end"
                fontSize={10}
                fill="#737784"
                fontWeight={600}
              >
                {tick}%
              </text>
            </g>
          );
        })}

        {/* X axis labels */}
        {points.map((p) => (
          <text
            key={`x-${p.snap.period}`}
            x={p.x}
            y={HEIGHT - PADDING.bottom + 16}
            textAnchor="middle"
            fontSize={10}
            fill="#434653"
            fontWeight={600}
          >
            {p.snap.period}
          </text>
        ))}

        {/* Trend line */}
        {sorted.length > 1 && (
          <path d={pathD} fill="none" stroke="#003c90" strokeWidth={2.5} strokeLinejoin="round" />
        )}

        {/* Data points */}
        {points.map((p) => (
          <g key={`pt-${p.snap.period}`}>
            <circle cx={p.x} cy={p.y} r={5} fill="#003c90" />
            <circle cx={p.x} cy={p.y} r={2.5} fill="white" />
            <text
              x={p.x}
              y={p.y + 18}
              textAnchor="middle"
              fontSize={11}
              fill="#003c90"
              fontWeight={700}
            >
              {p.snap.total.toFixed(1)}%
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
