import type { ApprovalKind, ApprovalSummary } from '../types/approval.types';

interface ApprovalTabsProps {
  active: ApprovalKind | 'All';
  summary: ApprovalSummary;
  onChange: (kind: ApprovalKind | 'All') => void;
}

const tabs: Array<{ id: ApprovalKind | 'All'; label: string; countKey: keyof ApprovalSummary }> = [
  { id: 'All', label: 'All', countKey: 'totalPending' },
  { id: 'Proposal', label: 'Proposals', countKey: 'proposals' },
  { id: 'EngagementLetter', label: 'Engagement Letters', countKey: 'engagementLetters' },
  { id: 'HandoverMemo', label: 'Handover Memos', countKey: 'handoverMemos' }
];

export const ApprovalTabs = ({ active, summary, onChange }: ApprovalTabsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#eceef0] p-1.5">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const count = summary[tab.countKey];
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={
              isActive
                ? 'inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#003c90] shadow-sm transition-colors'
                : 'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[#737784] transition-colors hover:text-[#191c1e]'
            }
          >
            <span>{tab.label}</span>
            <span
              className={
                isActive
                  ? 'inline-flex min-w-[20px] justify-center rounded-full bg-[#003c90]/10 px-2 text-[10px] font-bold text-[#003c90]'
                  : 'inline-flex min-w-[20px] justify-center rounded-full bg-white px-2 text-[10px] font-bold text-[#737784]'
              }
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
