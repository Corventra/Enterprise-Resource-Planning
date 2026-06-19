import type { RevenueMonthlyInvoiceTrendPoint } from '../../types/revenue-analytics.types';
import { chartAxisMaxForPeak, formatDashboardAxisCurrency, formatDashboardCurrency } from '../../utils/format-dashboard';

interface MonthlyInvoiceTrendChartProps {
  points: RevenueMonthlyInvoiceTrendPoint[];
  compact?: boolean;
}

type TrendMetricKey = 'invoiced' | 'paid' | 'outstanding' | 'overdue';

const resolveInvoiced = (point: RevenueMonthlyInvoiceTrendPoint) => point.invoiced ?? point.due ?? 0;

const metricValue = (point: RevenueMonthlyInvoiceTrendPoint, key: TrendMetricKey) =>
  key === 'invoiced' ? resolveInvoiced(point) : point[key];

/** Selaras dengan accent `CeoSummaryCard` di revenue-invoice-analytics-section. */
const BAR_SERIES: Array<{
  key: TrendMetricKey;
  color: string;
  label: string;
  tooltipLabel: string;
}> = [
  { key: 'invoiced', color: '#0f52ba', label: 'Total Invoiced', tooltipLabel: 'Total Invoiced' },
  { key: 'paid', color: '#2ea87a', label: 'Payments Received', tooltipLabel: 'Payments Received' },
  { key: 'outstanding', color: '#c49a00', label: 'Outstanding Amount', tooltipLabel: 'Outstanding Amount' },
  { key: 'overdue', color: '#d94a4a', label: 'Overdue Amount', tooltipLabel: 'Overdue Amount' }
];

/** Grouped bar chart — invoiced, paid, outstanding EOM, overdue EOM per bulan. */
export const MonthlyInvoiceTrendChart = ({ points, compact = false }: MonthlyInvoiceTrendChartProps) => {
  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-[#737784]">Belum ada data tren invoice bulanan.</p>;
  }

  const visible = points.slice(-6);
  const rawMax = Math.max(
    ...visible.flatMap((p) => [resolveInvoiced(p), p.paid, p.outstanding, p.overdue]),
    0
  );
  const axisMax = chartAxisMaxForPeak(rawMax);
  const plotPx = compact ? 100 : 140;
  const barW = compact ? 'w-[6px] sm:w-[7px]' : 'w-[7px] sm:w-[9px]';

  const barHeight = (value: number) => (value > 0 ? Math.max((value / axisMax) * plotPx, 5) : 0);

  const legend = (
    <div
      className={`flex flex-wrap gap-3 text-[#434653] ${compact ? 'gap-2 text-[10px]' : 'justify-center gap-3 text-xs'}`}
    >
      {BAR_SERIES.map((series) => (
        <span key={series.key} className="inline-flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm" style={{ backgroundColor: series.color }} />
          {series.label}
        </span>
      ))}
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
          <div className="flex items-end justify-between gap-1.5 sm:gap-2" style={{ height: plotPx }}>
            {visible.map((point) => (
              <div key={point.month} className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex items-end gap-px sm:gap-0.5">
                  {BAR_SERIES.map((series) => {
                    const value = metricValue(point, series.key);
                    return (
                      <div
                        key={series.key}
                        className={`${barW} shrink-0 rounded-t-md`}
                        style={{
                          height: barHeight(value),
                          backgroundColor: series.color
                        }}
                        title={`${series.tooltipLabel} · ${point.label}: ${formatDashboardCurrency(value)}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
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

/** @deprecated Pakai `MonthlyInvoiceTrendChart`. */
export const MonthlyRevenueHealthChart = MonthlyInvoiceTrendChart;
