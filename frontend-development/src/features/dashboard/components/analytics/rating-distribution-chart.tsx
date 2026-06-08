import type { RatingDistributionData } from './analytics-shared';
import { CeoEmptyState } from '../ceo/ceo-dashboard-ui';

interface Props {
  data: RatingDistributionData;
}

const starColor: Record<number, string> = {
  5: 'bg-[#006544]',
  4: 'bg-[#1a8a6a]',
  3: 'bg-[#8a6d00]',
  2: 'bg-[#c2410c]',
  1: 'bg-[#ba1a1a]'
};

export const RatingDistributionChart = ({ data }: Props) => {
  if (!data || data.total === 0) {
    return <CeoEmptyState message="Belum ada milestone yang di-rate." hint="Rating muncul setelah PM beri quality_rating ke milestone Done." />;
  }
  const maxCount = Math.max(...data.buckets.map((b) => b.count), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between border-b border-[#eceef0] pb-2">
        <span className="text-xs text-[#737784]">Total milestone rated</span>
        <span className="text-sm font-bold text-[#191c1e]">{data.total} · avg {data.average.toFixed(2)}/5</span>
      </div>
      <ul className="space-y-2">
        {data.buckets.map((b) => {
          const pct = data.total > 0 ? (b.count / data.total) * 100 : 0;
          const widthPct = maxCount > 0 ? (b.count / maxCount) * 100 : 0;
          return (
            <li key={b.rating}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#434653]">
                  {b.rating} {'★'.repeat(b.rating)}
                </span>
                <span className="text-[#737784]">
                  {b.count} · {pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#f0f2f5]">
                <div
                  className={`h-full ${starColor[b.rating]}`}
                  style={{ width: `${widthPct.toFixed(1)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
