import { useState } from 'react';
import { Outlet } from 'react-router';
import { AppShell } from '../../components/shared/layout/app-shell/app-shell';
import { Sidebar } from '../../components/shared/layout/sidebar/sidebar';
import { MainContent } from '../../components/shared/layout/app-shell/main-content';
import { Header } from '../../components/shared/layout/header/header';
import { PageContainer } from '../../components/shared/layout/app-shell/page-container';

export const AppShellLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <AppShell>
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <MainContent isSidebarCollapsed={isSidebarCollapsed}>
        <Header isSidebarCollapsed={isSidebarCollapsed} />
        <main className="flex-1 overflow-auto">
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
      </MainContent>
    </AppShell>
  );
};
