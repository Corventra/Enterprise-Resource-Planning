import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { authService } from '../../auth/services/auth.service';
import type { DummyUser } from '../../auth/types/auth.types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<DummyUser | null>(null);

  useEffect(() => {
    const storedUser = authService.getStoredAuthUser();
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  if (!user) return null;

  const handleLogout = () => {
    authService.clearStoredAuthUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8 border border-gray-100">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-[#004A99] hover:bg-[#003a7a] rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Welcome back, {user.name}!</h2>
          <div className="space-y-2 text-blue-800">
            <p><span className="font-medium">Role:</span> {user.role}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
