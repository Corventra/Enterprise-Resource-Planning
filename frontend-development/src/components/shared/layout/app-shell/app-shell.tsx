import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-900 font-sans">
      {children}
    </div>
  );
};
