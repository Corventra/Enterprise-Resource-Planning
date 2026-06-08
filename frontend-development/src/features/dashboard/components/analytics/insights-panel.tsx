import { AlertTriangle, CheckCircle2, Info, Lightbulb } from 'lucide-react';
import type { InsightItem, InsightSeverity } from './analytics-shared';

interface Props {
  insights: InsightItem[];
  title?: string;
}

const severityMeta: Record<InsightSeverity, { cls: string; iconCls: string; Icon: typeof Info }> = {
  positive: { cls: 'border-[#c8e6d3] bg-[#e6f4ef]', iconCls: 'text-[#006544]', Icon: CheckCircle2 },
  warning: { cls: 'border-[#fde8b0] bg-[#fff7e0]', iconCls: 'text-[#8a6d00]', Icon: AlertTriangle },
  info: { cls: 'border-[#dce1ea] bg-[#f8f9fb]', iconCls: 'text-[#0f52ba]', Icon: Info }
};

export const InsightsPanel = ({ insights, title = 'Insight Otomatis' }: Props) => {
  if (!insights || insights.length === 0) return null;
  return (
    <article className="rounded-2xl border border-[#e4e7ec] bg-white p-4 shadow-[0_1px_2px_rgba(25,28,30,0.04),0_8px_24px_rgba(25,28,30,0.04)] sm:p-5">
      <div className="mb-3 flex items-center gap-2 border-b border-[#eceef0] pb-3">
        <Lightbulb className="h-4 w-4 text-[#003c90]" />
        <h3 className="text-sm font-bold text-[#191c1e]">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {insights.map((ins, idx) => {
          const meta = severityMeta[ins.severity];
          const Icon = meta.Icon;
          return (
            <li
              key={idx}
              className={`flex items-start gap-2.5 rounded-xl border ${meta.cls} px-3 py-2.5`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.iconCls}`} />
              <p className="text-xs leading-relaxed text-[#191c1e] sm:text-[13px]">{ins.text}</p>
            </li>
          );
        })}
      </ul>
    </article>
  );
};
