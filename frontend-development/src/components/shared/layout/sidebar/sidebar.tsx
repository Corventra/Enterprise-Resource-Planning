import { CorventraLogo } from '../../corventra-logo';
import { SidebarItem } from './sidebar-item';
import { SidebarToggle } from './sidebar-toggle';
import { sidebarNavItems } from '../../../../app/navigation/sidebar-nav';
import type { SidebarNavItem } from '../../../../types/navigation';
import { ROLES } from '../../../../app/permissions';
import { useAuth } from '../../../../app/store/auth-store';

/** Staff Admin: invoice + document center only (dashboard tetap sebagai beranda). */
const STAFF_ADMIN_NAV_PATHS = new Set(['/dashboard', '/invoice', '/document-center']);

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar = ({ isCollapsed, onToggleCollapse }: SidebarProps) => {
  const { role } = useAuth();

  const visibleItems = sidebarNavItems.filter((item) => {
    if (role === ROLES.STAFF_ADMIN) {
      return STAFF_ADMIN_NAV_PATHS.has(item.path);
    }
    if (role === ROLES.SUPERADMIN) {
      return true;
    }
    return !item.permission || (role !== null && item.permission.includes(role));
  });

  const groupedItems = visibleItems.reduce((acc, item) => {
    const groupName = item.group || 'Others';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(item);
    return acc;
  }, {} as Record<string, SidebarNavItem[]>);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-20 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* Brand Header */}
      <div className="relative flex items-center h-16 px-4 border-b border-slate-200">
        <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <CorventraLogo
            className={`shrink-0 object-contain ${isCollapsed ? 'h-8 w-8' : 'h-8 w-auto max-w-[140px]'}`}
          />
          {!isCollapsed && <span className="font-bold text-lg text-slate-800 tracking-tight">Corventra</span>}
        </div>
        <SidebarToggle isCollapsed={isCollapsed} onToggle={onToggleCollapse} />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(groupedItems).map(([group, items]) => (
          <div key={group} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {group}
              </h3>
            )}
            <ul className="space-y-1 z-10 relative">
              {items.map((item) => (
                <li key={item.path}>
                  <SidebarItem item={item} isCollapsed={isCollapsed} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

    </aside>
  );
};
