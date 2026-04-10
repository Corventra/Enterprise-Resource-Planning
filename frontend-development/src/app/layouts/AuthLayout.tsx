import React from 'react';
import { Outlet } from 'react-router';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full font-sans antialiased text-gray-900 bg-[#F9FAFB]">
      <Outlet />
    </div>
  );
};
