import { ArrowDownLeft, ArrowUpRight, Calculator } from 'lucide-react';
import {
  KPI_DIMENSION_DESCRIPTIONS,
  KPI_DIMENSION_LABELS,
  KPI_DIMENSION_TYPE,
  type KpiDimensionKey,
  type KpiDimensionScore
} from '../types/kpi.types';

interface KpiDimensionCardProps {
  dimensionKey: KpiDimensionKey;
  score: KpiDimensionScore;
}

const capaianToneRing = (capaian: number): string => {
  if (capaian >= 80) return 'ring-[#006544]/30';
  if (capaian >= 60) return 'ring-[#003c90]/30';
  if (capaian >= 40) return 'ring-amber-300/60';
  return 'ring-orange-300/60';
};

const capaianToneText = (capaian: number): string => {
  if (capaian >= 80) return 'text-[#006544]';
  if (capaian >= 60) return 'text-[#003c90]';
  if (capaian >= 40) return 'text-[#a16207]';
  return 'text-[#c2410c]';
};

const capaianToneBar = (capaian: number): string => {
  if (capaian >= 80) return 'from-[#006544] to-[#04a96f]';
  if (capaian >= 60) return 'from-[#003c90] to-[#0f52ba]';
  if (capaian >= 40) return 'from-[#a16207] to-[#d97706]';
  return 'from-[#c2410c] to-[#ea580c]';
};

const formatRaw = (key: KpiDimensionKey, raw: number): string => {
  switch (key) {
    case 'taskCompletion':
      return `${(raw * 100).toFixed(1)}% weighted progress`;
    case 'timeliness':
      return `${(raw * 100).toFixed(1)}% on-time ratio`;
    case 'updateCompliance':
      return raw === 0 ? 'No gap data' : `Avg gap ${raw.toFixed(1)} days`;
    case 'outputQuality':
      return raw === 0 ? 'No rated tasks' : `Avg rating ${raw.toFixed(2)}/5`;
    default:
      return `${raw}`;
  }
};

export const KpiDimensionCard = ({ dimensionKey, score }: KpiDimensionCardProps) => {
  const indicatorType = KPI_DIMENSION_TYPE[dimensionKey];
  const TypeIcon = indicatorType === 'benefit' ? ArrowUpRight : ArrowDownLeft;
  const capPct = Math.min(100, Math.max(0, score.capaian));

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ${capaianToneRing(score.capaian)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#737784]">
            {KPI_DIMENSION_LABELS[dimensionKey]}
          </p>
          <p className="mt-0.5 text-[11px] text-[#737784]">{KPI_DIMENSION_DESCRIPTIONS[dimensionKey]}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#eceef0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#434653]">
          <TypeIcon className="h-3 w-3" strokeWidth={2.4} />
          {indicatorType}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <p className={`text-3xl font-bold tracking-tight ${capaianToneText(score.capaian)}`}>
          {score.capaian.toFixed(1)}%
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#d5e3fc] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#003c90]">
          <Calculator className="h-3 w-3" />
          w {Math.round(score.weight * 100)}%
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-[#eceef0]">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all ${capaianToneBar(score.capaian)}`}
          style={{ width: `${capPct}%` }}
        />
      </div>

      <p className="text-xs font-medium text-[#434653]">{formatRaw(dimensionKey, score.rawValue)}</p>

      {score.contributingTaskIds.length > 0 && (
        <p className="text-[10px] text-[#737784]">
          {score.contributingTaskIds.length} contributing task
          {score.contributingTaskIds.length === 1 ? '' : 's'}
        </p>
      )}
    </div>
  );
};
