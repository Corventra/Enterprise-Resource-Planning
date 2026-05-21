import { formatDashboardNumber } from '../utils/format-dashboard';
import { CeoEmptyState } from './ceo/ceo-dashboard-ui';

interface RankedHorizontalBarListProps {
  items: Array<{ name: string; value: number; subtitle?: string }>;
  valueFormatter?: (value: number) => string;
  accentClass?: string;
  /** Semua bar memakai satu gradasi (mis. panel overdue). Default: gradasi per peringkat. */
  uniformAccent?: boolean;
  maxItems?: number;
}

const rankAccent = [
  'from-[#003c90] to-[#0f52ba]',
  'from-[#0f52ba] to-[#2d6fd4]',
  'from-[#2d6fd4] to-[#5a8fe0]',
  'from-[#5a8fe0] to-[#8ab0ea]',
  'from-[#8ab0ea] to-[#b8cff5]'
];

export const RankedHorizontalBarList = ({
  items,
  valueFormatter = formatDashboardNumber,
  accentClass = 'from-[#003c90] to-[#0f52ba]',
  uniformAccent = false,
  maxItems = 5
}: RankedHorizontalBarListProps) => {
  const visible = items.slice(0, maxItems);
  if (visible.length === 0) {
    return <CeoEmptyState message="Belum ada data peringkat." />;
  }

  const max = Math.max(...visible.map((i) => i.value), 1);

  return (
    <ul className="space-y-4">
      {visible.map((item, index) => {
        const widthPct = Math.max(6, Math.round((item.value / max) * 100));
        const gradient = uniformAccent ? accentClass : (rankAccent[index] ?? accentClass);

        return (
          <li key={`${item.name}-${index}`}>
            <div className="mb-1.5 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#f2f4f8] text-[11px] font-bold text-[#434653]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#191c1e]">{item.name}</p>
                  {item.subtitle ? <p className="truncate text-xs text-[#737784]">{item.subtitle}</p> : null}
                </div>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-[#191c1e]">{valueFormatter(item.value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#eef1f6]">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                style={{ width: `${widthPct}%` }}
                title={`${item.name}: ${valueFormatter(item.value)}`}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};
