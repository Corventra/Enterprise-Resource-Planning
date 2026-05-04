import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../app/store/auth-store';
import { ROLE_LABELS } from '../../../app/permissions';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8 border border-gray-100">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] hover:bg-[linear-gradient(135deg,#002d6b_0%,#0c4190_100%)] rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Welcome back, {user.name}!</h2>
          <div className="space-y-2 text-blue-800">
            <p><span className="font-medium">Role:</span> {ROLE_LABELS[user.role]} ({user.role})</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
