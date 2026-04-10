import React from 'react';
import { LoginBranding } from '../components/LoginBranding';
import { LoginForm } from '../components/LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex w-full">
      {/* Kolom Kiri: Branding (Desktop Only) */}
      <LoginBranding />

      {/* Kolom Kanan: Login Form & Footer Wrapper */}
      <div className="flex-1 lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        {/* Main Content Form */}
        <div className="flex-1 flex flex-col justify-center">
          <LoginForm />
        </div>

        {/* Footer Area */}
        <footer className="mt-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} ERP System. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4">
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gray-900 transition-colors flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security Architecture
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};
