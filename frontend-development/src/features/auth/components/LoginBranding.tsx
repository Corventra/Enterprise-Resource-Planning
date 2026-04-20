import React from 'react';
import { CorventraLogo } from '../../../components/shared/corventra-logo';

export const LoginBranding: React.FC = () => {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-[#004A99] p-12 xl:p-16 text-white w-full lg:w-1/2">
      <div>
        <div className="flex items-center gap-3 mb-16">
          <CorventraLogo className="h-10 w-auto max-w-[220px]" />
          <span className="text-2xl font-semibold tracking-tight">Corventra</span>
        </div>
      </div>
    </div>
  );
};