import { HeaderSearch } from './header-search';
import { UserMenu } from './user-menu';

interface HeaderProps {
  isSidebarCollapsed: boolean;
}

export const Header = ({ isSidebarCollapsed }: HeaderProps) => {
  return (
    <header
      data-sidebar-collapsed={isSidebarCollapsed}
      className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 transition-all duration-300"
    >
      <div className="flex-1 flex items-center gap-4">
        <HeaderSearch />
      </div>
      
      <div className="flex items-center gap-4">
        {/* Placeholder for notifications or other header icons could go here */}
        <UserMenu />
      </div>
    </header>
  );
};
