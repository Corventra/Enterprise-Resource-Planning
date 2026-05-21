import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CeoKpiMetric } from '../../types/ceo-dashboard.types';
import { formatDashboardCurrency } from '../../utils/format-dashboard';

export const ceoSummaryCardClass =
  'group relative overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white p-4 shadow-[0_1px_2px_rgba(25,28,30,0.04),0_8px_24px_rgba(25,28,30,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(25,28,30,0.08)] sm:p-5';

interface CeoSummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  accent: string;
  footer?: ReactNode;
  /** KPI pipeline — ikon & padding lebih ringkas */
  compact?: boolean;
}

export const CeoSummaryCard = ({ title, value, icon: Icon, accent, footer, compact = false }: CeoSummaryCardProps) => (
  <article className={compact ? `${ceoSummaryCardClass} !p-3 sm:!p-3.5` : ceoSummaryCardClass}>
    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
    <div className={`flex items-start justify-between ${compact ? 'gap-2' : 'gap-3'}`}>
      <div className="min-w-0 flex-1">
        <p className={`font-bold uppercase tracking-wider text-[#737784] ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          {title}
        </p>
        <p
          className={`font-bold tracking-tight text-[#191c1e] ${
            compact ? 'mt-1 text-lg sm:text-xl' : 'mt-2 text-2xl sm:text-[1.75rem]'
          }`}
        >
          {value}
        </p>
      </div>
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm ${accent} ${
          compact ? 'h-7 w-7 rounded-md' : 'h-10 w-10 rounded-xl'
        }`}
      >
        <Icon className={compact ? 'h-3.5 w-3.5' : 'h-5 w-5'} strokeWidth={compact ? 2.25 : 2} />
      </div>
    </div>
    {footer ? <div className={`border-t border-[#f0f2f5] ${compact ? 'mt-2.5 pt-2.5' : 'mt-4 pt-3'}`}>{footer}</div> : null}
  </article>
);

export const CeoMetricDeltaBadge = ({ metric }: { metric: CeoKpiMetric }) => {
  if (metric.delta.direction === 'flat') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f4f6] px-2 py-0.5 text-xs font-bold text-[#737784]">
        <Minus className="h-3.5 w-3.5" /> 0%
      </span>
    );
  }
  const up = metric.delta.direction === 'up';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
        up ? 'bg-[#e6f4ef] text-[#006544]' : 'bg-[#fdecec] text-[#ba1a1a]'
      }`}
    >
      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {metric.delta.value}%
    </span>
  );
};

export const CeoMetricDeltaFooter = ({
  metric,
  comparisonLabel,
  currency = true
}: {
  metric: CeoKpiMetric;
  comparisonLabel: string;
  currency?: boolean;
}) => {
  const formattedPrevious = currency ? formatDashboardCurrency(metric.previous) : String(metric.previous);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CeoMetricDeltaBadge metric={metric} />
      <span className="text-xs text-[#737784]">
        {comparisonLabel.toLowerCase()} · <span className="font-semibold text-[#434653]">{formattedPrevious}</span>
      </span>
    </div>
  );
};

export const ceoPanelClass =
  'rounded-2xl border border-[#e4e7ec] bg-white p-4 shadow-[0_1px_2px_rgba(25,28,30,0.04),0_8px_24px_rgba(25,28,30,0.04)] sm:p-5';

export const ceoSectionClass = 'space-y-5';

interface CeoSectionHeaderProps {
  title: string;
  description: string;
  badge?: string;
}

export const CeoSectionHeader = ({ title, description, badge }: CeoSectionHeaderProps) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 className="text-lg font-bold tracking-tight text-[#191c1e] sm:text-xl">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#737784]">{description}</p>
    </div>
    {badge ? (
      <span className="inline-flex w-fit shrink-0 rounded-full border border-[#dce1ea] bg-[#f8f9fb] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#434653]">
        {badge}
      </span>
    ) : null}
  </div>
);

interface CeoPanelProps {
  title: string;
  subtitle?: string;
  insight?: string;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
  /** Header minimal seperti referensi revenue (judul saja, tanpa garis pemisah). */
  variant?: 'default' | 'minimal';
}

export const CeoPanel = ({
  title,
  subtitle,
  insight,
  children,
  className = '',
  headerRight,
  variant = 'default'
}: CeoPanelProps) => (
  <article className={`${ceoPanelClass} ${className}`}>
    <div
      className={
        variant === 'minimal'
          ? 'mb-5 flex items-start justify-between gap-3'
          : 'mb-4 flex items-start justify-between gap-3 border-b border-[#eceef0] pb-3'
      }
    >
      <div className="min-w-0">
        <h3 className={variant === 'minimal' ? 'text-base font-bold tracking-tight text-[#191c1e]' : 'text-sm font-bold text-[#191c1e]'}>
          {title}
        </h3>
        {subtitle ? <p className="mt-0.5 text-xs text-[#737784]">{subtitle}</p> : null}
      </div>
      {headerRight ? <div className="shrink-0 pt-0.5">{headerRight}</div> : null}
    </div>
    {children}
    {insight ? (
      <p className="mt-4 rounded-lg bg-[#f8f9fb] px-3 py-2 text-xs leading-relaxed text-[#434653]">{insight}</p>
    ) : null}
  </article>
);

export const CeoEmptyState = ({ message, hint }: { message: string; hint?: string }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#dce1ea] bg-[#fafbfc] px-4 py-10 text-center">
    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#eef1f6] text-[#737784]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
      </svg>
    </div>
    <p className="text-sm font-semibold text-[#434653]">{message}</p>
    {hint ? <p className="mt-1 max-w-xs text-xs text-[#737784]">{hint}</p> : null}
  </div>
);

export const CeoDashboardSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-32 rounded-2xl bg-[#eceef0]" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="h-72 rounded-2xl bg-[#eceef0]" />
      <div className="h-72 rounded-2xl bg-[#eceef0]" />
    </div>
  </div>
);
