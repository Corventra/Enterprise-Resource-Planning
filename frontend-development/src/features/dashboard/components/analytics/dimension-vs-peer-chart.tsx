import type { DimensionVsPeerData } from './analytics-shared';
import { CeoEmptyState } from '../ceo/ceo-dashboard-ui';

interface Props {
  data: DimensionVsPeerData;
}

/**
 * Side-by-side bar comparison: self vs department average per dimension.
 * Self = biru solid; Peer = abu-abu lebih tipis.
 */
export const DimensionVsPeerChart = ({ data }: Props) => {
  const hasData = data?.dimensions?.some((d) => d.self_value > 0 || d.peer_avg > 0);
  if (!hasData) {
    return (
      <CeoEmptyState
        message="Belum ada data perbandingan."
        hint="Perbandingan muncul setelah Anda dan kolega satu department punya snapshot KPI di periode yang sama."
      />
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#dce1ea] bg-[#f8f9fb] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Total Anda</p>
          <p className="mt-1 text-2xl font-bold text-[#003c90]">{data.self_total.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-[#dce1ea] bg-[#f8f9fb] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Rata-rata Department</p>
          <p className="mt-1 text-2xl font-bold text-[#737784]">{data.peer_total_avg.toFixed(1)}</p>
        </div>
      </div>
      <ul className="space-y-4">
        {data.dimensions.map((d) => {
          const deltaCls = d.delta > 0
            ? 'text-[#006544]'
            : d.delta < 0
            ? 'text-[#ba1a1a]'
            : 'text-[#737784]';
          const sign = d.delta > 0 ? '+' : '';
          return (
            <li key={d.key}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
                <span className="font-semibold text-[#434653]">{d.label}</span>
                <span className={`text-[11px] font-bold tabular-nums ${deltaCls}`}>{sign}{d.delta.toFixed(1)}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-12 text-[10px] text-[#737784]">Anda</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f0f2f5]">
                    <div
                      className="h-full bg-[#003c90]"
                      style={{ width: `${Math.max(0, Math.min(100, d.self_value))}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-[10px] font-bold tabular-nums text-[#191c1e]">{d.self_value.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-[10px] text-[#737784]">Dept avg</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f0f2f5]">
                    <div
                      className="h-full bg-[#a3a8b5]"
                      style={{ width: `${Math.max(0, Math.min(100, d.peer_avg))}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-[10px] font-bold tabular-nums text-[#737784]">{d.peer_avg.toFixed(0)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
