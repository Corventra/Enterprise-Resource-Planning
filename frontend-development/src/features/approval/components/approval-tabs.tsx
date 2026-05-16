import { NavLink } from 'react-router';
import type { ApprovalTab } from '../types/approval.types';

const tabs: Array<{ key: ApprovalTab; label: string; to: string }> = [
  { key: 'proposal', label: 'Proposal', to: '/approval/proposal' },
  { key: 'engagement-letter', label: 'Engagement Letter', to: '/approval/engagement-letter' },
  { key: 'handover', label: 'Handover', to: '/approval/handover' }
];

export const ApprovalTabs = () => {
  return (
    <div className="mb-6 flex gap-6 border-b border-[#e6e8ea]">
      {tabs.map((tab) => (
        <NavLink
          key={tab.key}
          to={tab.to}
          className={({ isActive }) =>
            `border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
              isActive ? 'border-[#003c90] text-[#003c90]' : 'border-transparent text-[#515f74] hover:text-[#003c90]'
            }`
          }
          end
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
};
