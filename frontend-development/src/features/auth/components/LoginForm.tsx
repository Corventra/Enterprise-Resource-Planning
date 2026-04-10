import React from 'react';
import { useLoginForm } from '../hooks/useLoginForm';

export const LoginForm: React.FC = () => {
  const { formData, errors, isLoading, handleChange, handleSubmit } = useLoginForm();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8 lg:hidden flex items-center gap-3 justify-center">
        <div className="w-8 h-8 bg-[#004A99] rounded-lg flex items-center justify-center text-white font-bold">
          E
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">ERP System</span>
      </div>

      <div className="bg-white px-8 py-10 shadow-lg rounded-2xl border border-gray-100/50">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Login</h2>
          <p className="text-sm text-gray-500 mt-2">Please enter your credentials to access the system.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {errors.submit && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm mb-4 border border-red-100">
              {errors.submit}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-4 py-2.5 rounded-lg border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#004A99]'
                } focus:outline-none focus:ring-2 focus:border-transparent transition-colors sm:text-sm`}
              placeholder="admin@company.com"
            />
            {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-4 py-2.5 rounded-lg border ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#004A99]'
                } focus:outline-none focus:ring-2 focus:border-transparent transition-colors sm:text-sm`}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1.5 text-sm text-red-500">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isLoading}
                className="h-4 w-4 text-[#004A99] focus:ring-[#004A99] border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-[#004A99] hover:text-[#003a7a] transition-colors">
                Forgot your password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#004A99] hover:bg-[#003a7a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004A99] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="#" className="font-medium text-[#004A99] hover:text-[#003a7a]">
              Contact Superadmin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
