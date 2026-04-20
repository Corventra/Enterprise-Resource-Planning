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
        `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-[#003c90]/10 text-[#003c90]'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
      title={isCollapsed ? item.label : undefined}
    >
      {Icon && <Icon className="h-5 w-5 shrink-0" />}
      {!isCollapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
};
