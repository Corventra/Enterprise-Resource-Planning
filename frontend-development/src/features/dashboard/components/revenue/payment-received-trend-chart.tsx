import type { RevenueTrendPoint } from '../../types/revenue-analytics.types';
import { chartAxisMaxForPeak, formatDashboardAxisCurrency, formatDashboardCurrency } from '../../utils/format-dashboard';

interface PaymentReceivedTrendChartProps {
  points: RevenueTrendPoint[];
  compact?: boolean;
}

const LINE_COLOR = '#0f52ba';

const toPlotCoords = (visible: RevenueTrendPoint[], axisMax: number, plotPx: number) =>
  visible.map((point, index) => {
    const x =
      visible.length === 1 ? 50 : (index / (visible.length - 1)) * 100;
    const y = axisMax > 0 ? plotPx - (point.value / axisMax) * plotPx : plotPx;
    return { ...point, x, y };
  });

/** Line chart — arus kas masuk per bulan (fluktuasi naik-turun terlihat dari garis). */
export const PaymentReceivedTrendChart = ({ points, compact = false }: PaymentReceivedTrendChartProps) => {
  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-[#737784]">Belum ada arus pembayaran pada periode ini.</p>;
  }

  const visible = points.slice(-6);
  const rawMax = Math.max(...visible.map((p) => p.value), 0);
  const axisMax = chartAxisMaxForPeak(rawMax);
  const plotPx = compact ? 100 : 140;
  const coords = toPlotCoords(visible, axisMax, plotPx);

  const linePath = coords
    .map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x} ${coord.y}`)
    .join(' ');

  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${plotPx} L ${coords[0].x} ${plotPx} Z`
      : '';

  const legend = (
    <div
      className={`flex flex-wrap gap-3 text-[#434653] ${compact ? 'gap-2 text-[10px]' : 'justify-center gap-4 text-xs'}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="h-0.5 w-4 rounded-full bg-[#0f52ba]" />
        Pembayaran diterima (arus masuk)
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
            <span key={tick} className="max-w-full truncate">
              {formatDashboardAxisCurrency(tick)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            <div className="border-t border-dashed border-[#e4e7ec]" />
            <div className="border-t border-dashed border-[#e4e7ec]" />
            <div className="border-t border-[#e4e7ec]" />
          </div>
          <svg
            viewBox={`0 0 100 ${plotPx}`}
            preserveAspectRatio="none"
            className="relative block h-full w-full overflow-visible"
            style={{ height: plotPx }}
            aria-hidden
          >
            <defs>
              <linearGradient id="payment-trend-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={LINE_COLOR} stopOpacity="0.22" />
                <stop offset="100%" stopColor={LINE_COLOR} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {areaPath ? <path d={areaPath} fill="url(#payment-trend-area)" /> : null}
            <path
              d={linePath}
              fill="none"
              stroke={LINE_COLOR}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {coords.map((coord) => (
            <div
              key={coord.month}
              className="absolute z-10 -translate-x-1/2 translate-y-1/2"
              style={{
                left: `${coord.x}%`,
                top: coord.y
              }}
              title={`Pembayaran · ${coord.label}: ${formatDashboardCurrency(coord.value)}`}
            >
              <span className="block h-2.5 w-2.5 rounded-full border-2 border-white bg-[#0f52ba] shadow-sm" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pl-8 sm:gap-3 sm:pl-9">
        {visible.map((point) => (
          <p
            key={`${point.month}-lbl`}
            className="min-w-0 flex-1 truncate text-center text-[10px] font-medium text-[#737784]"
          >
            {point.label}
          </p>
        ))}
      </div>
      {legend}
    </div>
  );
};
