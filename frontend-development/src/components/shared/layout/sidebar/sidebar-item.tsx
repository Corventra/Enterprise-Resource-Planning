import { NavLink } from 'react-router';
import type { SidebarNavItem } from '../../../../types/navigation';

interface SidebarItemProps {
  item: SidebarNavItem;
  isCollapsed: boolean;
}

export const SidebarItem = ({ item, isCollapsed }: SidebarItemProps) => {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
      title={isCollapsed ? item.label : undefined}
    >
      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
      {!isCollapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
};
