import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../store/auth-store';
import { canAccessMeetingsMonitor } from '../../features/meetings/utils/meetings-access';

export const MeetingsAccessGuard = () => {
  const { role, departments, isHydrating } = useAuth();

  if (isHydrating) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Memuat sesi…
      </div>
    );
  }

  if (!canAccessMeetingsMonitor(role, departments)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
