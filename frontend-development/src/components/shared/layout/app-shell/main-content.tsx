import type { ReactNode } from 'react';

interface MainContentProps {
  isSidebarCollapsed: boolean;
  children: ReactNode;
}

export const MainContent = ({ isSidebarCollapsed, children }: MainContentProps) => {
  return (
    <div 
      className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        isSidebarCollapsed ? 'ml-20' : 'ml-64'
      }`}
    >
      {children}
    </div>
  );
};
