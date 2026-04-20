import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {children}
    </div>
  );
};
