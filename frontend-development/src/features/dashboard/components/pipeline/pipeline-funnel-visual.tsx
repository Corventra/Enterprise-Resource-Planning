import type { PipelineAnalytics } from '../../types/pipeline-analytics.types';
import { formatDashboardNumber, formatDashboardPercent } from '../../utils/format-dashboard';

interface PipelineFunnelVisualProps {
  funnel: PipelineAnalytics['funnel'];
  conversions: PipelineAnalytics['conversions'];
  totalConversion: number;
}

const DISPLAY_STAGES = [
  'Lead',
  'Meeting',
  'Minutes Completed',
  'Proposal',
  'Engagement Letter Signed',
  'Handover Approved'
] as const;

const STAGE_LABEL: Record<string, string> = {
  Lead: 'LEAD',
  Meeting: 'MEETING',
  'Minutes Completed': 'MINUTES',
  Proposal: 'PROPOSAL',
  'Engagement Letter Signed': 'EL SIGNED',
  'Handover Approved': 'HANDOVER'
};

const STAGE_COLORS = ['#003c90', '#1e4d8c', '#3a6299', '#5a7aab', '#0f52ba', '#b8c5d9'];

const chevronClip = (index: number, total: number) => {
  const arrow = 14;
  if (index === 0) {
    return `polygon(0 0, calc(100% - ${arrow}px) 0, 100% 50%, calc(100% - ${arrow}px) 100%, 0 100%)`;
  }
  if (index === total - 1) {
    return `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${arrow}px 50%)`;
  }
  return `polygon(0 0, calc(100% - ${arrow}px) 0, 100% 50%, calc(100% - ${arrow}px) 100%, 0 100%, ${arrow}px 50%)`;
};

export const PipelineFunnelLegend = () => (
  <span className="inline-flex items-center gap-2 text-[11px] font-medium text-[#737784]">
    <span className="h-2.5 w-2.5 rounded-full bg-[#0f52ba]" />
    Volume Aktif
  </span>
);

export const PipelineFunnelVisual = ({ funnel, conversions, totalConversion }: PipelineFunnelVisualProps) => {
  const stages = DISPLAY_STAGES.map((name, index) => {
    const row = funnel.find((s) => s.stage === name);
    return {
      stage: name,
      label: STAGE_LABEL[name] ?? name,
      count: row?.count ?? 0,
      color: STAGE_COLORS[index] ?? '#b8c5d9',
      highlight: name === 'Engagement Letter Signed'
    };
  });

  const conversionMetrics: Array<{
    label: string;
    value: number;
    sub: string | null;
    highlight?: boolean;
  }> = [
    { label: 'Lead → Meeting', value: conversions.lead_to_meeting, sub: null },
    { label: 'Proposal → EL Signed', value: conversions.proposal_to_el_signed, sub: null },
    { label: 'EL Signed → Handover', value: conversions.el_signed_to_handover_approved, sub: null },
    { label: 'Total Conversion', value: totalConversion, sub: 'Lead → Won', highlight: true }
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-[520px] flex-col gap-3">
          <div className="flex w-full">
            {stages.map((stage, index) => (
              <div
                key={stage.stage}
                className="relative flex min-w-0 flex-1 items-center justify-center"
                style={{ marginLeft: index > 0 ? -6 : 0, zIndex: stages.length - index }}
              >
                <div
                  className={`flex h-[4.25rem] w-full items-center justify-center sm:h-[4.75rem] ${
                    stage.highlight ? 'shadow-md ring-2 ring-[#0f52ba]/30' : ''
                  }`}
                  style={{
                    backgroundColor: stage.color,
                    clipPath: chevronClip(index, stages.length)
                  }}
                >
                  <span className="px-2 text-center text-lg font-bold tabular-nums tracking-tight text-white sm:text-xl">
                    {formatDashboardNumber(stage.count)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex min-w-[520px]">
            {stages.map((stage) => (
              <p
                key={`${stage.stage}-lbl`}
                className="min-w-0 flex-1 text-center text-[10px] font-bold uppercase tracking-wider text-[#737784] sm:text-[11px]"
              >
                {stage.label}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-[#eceef0] pt-5 sm:grid-cols-4 sm:gap-4">
        {conversionMetrics.map((item) => (
          <div
            key={item.label}
            className={`flex min-h-[5.75rem] min-w-0 flex-col justify-between px-1 py-1 sm:min-h-[6rem] ${
              item.highlight ? 'rounded-2xl bg-[#eef3fb] px-4 py-3 text-center sm:px-5' : ''
            }`}
          >
            <p
              className={`min-h-[2rem] text-[11px] leading-snug ${
                item.highlight ? 'font-bold uppercase tracking-wider text-[#003c90]' : 'font-medium text-[#737784]'
              }`}
            >
              {item.label}
            </p>
            <p className="text-xl font-bold leading-none tracking-tight text-[#003c90] sm:text-[1.75rem]">
              {formatDashboardPercent(item.value)}
            </p>
            <p className={`min-h-[0.875rem] text-[10px] leading-none ${item.sub ? 'text-[#737784]' : 'invisible'}`}>
              {item.sub ?? '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
