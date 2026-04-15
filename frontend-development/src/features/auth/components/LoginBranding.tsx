import React from 'react';

export const LoginBranding: React.FC = () => {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-[#004A99] p-12 xl:p-16 text-white w-full lg:w-1/2">
      <div>
        <div className="flex items-center gap-3 mb-16">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#004A99] font-bold text-xl">
            E
          </div>
          <span className="text-2xl font-semibold tracking-tight">ERP System</span>
        </div>
      </div>
    </div>
  );
};