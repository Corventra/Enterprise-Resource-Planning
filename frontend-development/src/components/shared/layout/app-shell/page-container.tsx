import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export const PageContainer = ({ children }: PageContainerProps) => {
  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      {children}
    </div>
  );
};
