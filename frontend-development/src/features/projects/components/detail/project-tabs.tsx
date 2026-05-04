import { NavLink } from 'react-router';
import { PERMISSIONS, type Permission } from '../../../../app/permissions';
import { useAuth } from '../../../../app/store/auth-store';

interface ProjectTabsProps {
  projectId: string;
}

interface TabDef {
  key: string;
  label: string;
  /** When set, tab is hidden unless the current role has any of these permissions. */
  requirePermissions?: Permission[];
}

const tabs: TabDef[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'team', label: 'Team' },
  { key: 'documents', label: 'Documents' },
  { key: 'financials', label: 'Financials', requirePermissions: [PERMISSIONS.PROJECT_VIEW_FINANCIALS] }
];

export const ProjectTabs = ({ projectId }: ProjectTabsProps) => {
  const { canAny } = useAuth();
  const visibleTabs = tabs.filter(
    (tab) => !tab.requirePermissions || canAny(tab.requirePermissions)
  );

  return (
    <div className="mb-6 flex gap-6 border-b border-[#e6e8ea]">
      {visibleTabs.map((tab) => (
        <NavLink
          key={tab.key}
          to={`/projects/${projectId}/${tab.key}`}
          className={({ isActive }) =>
            `border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
              isActive
                ? 'border-[#003c90] text-[#003c90]'
                : 'border-transparent text-[#515f74] hover:text-[#003c90]'
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
