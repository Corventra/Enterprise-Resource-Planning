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

        <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
          Streamline your business operations
        </h1>
        <p className="text-[#004A99] text-opacity-80 mb-12 text-blue-100 text-lg">
          The all-in-one enterprise resource planning solution designed for modern, forward-thinking organizations.
        </p>

        <div className="space-y-6">
          <FeatureItem
            title="Adaptable performance"
            description="Scales effortlessly with your company's growing needs and evolving workflows."
            icon={(
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )}
          />
          <FeatureItem
            title="Built to last"
            description="Enterprise-grade architecture that delivers unparalleled reliability and security."
            icon={(
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          />
          <FeatureItem
            title="Great user experience"
            description="Intuitive and modern interface designed for maximum productivity."
            icon={(
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          />
          <FeatureItem
            title="Innovative functionality"
            description="Cutting-edge features that keep you ahead of the competition."
            icon={(
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          />
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-blue-100 text-sm mt-1">{description}</p>
    </div>
  </div>
);
