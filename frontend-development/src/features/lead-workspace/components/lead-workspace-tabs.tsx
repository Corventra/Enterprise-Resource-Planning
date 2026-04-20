import { NavLink } from 'react-router';
import type { WorkspaceTab } from '../types/lead-workspace.types';

interface LeadWorkspaceTabsProps {
  leadId: string;
}

const tabs: Array<{ key: WorkspaceTab; label: string }> = [
  { key: 'meeting', label: 'Meeting & Minutes' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'engagement-letter', label: 'Engagement Letter' }
];

export const LeadWorkspaceTabs = ({ leadId }: LeadWorkspaceTabsProps) => {
  return (
    <div className="mb-6 flex gap-6 border-b border-[#e6e8ea]">
      {tabs.map((tab) => (
        <NavLink
          key={tab.key}
          to={`/lead-workspace/${leadId}/${tab.key}`}
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
