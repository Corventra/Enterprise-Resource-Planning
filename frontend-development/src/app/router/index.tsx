import { Routes, Route, Navigate } from 'react-router';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { AppShellLayout } from '../layouts/app-shell-layout';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<AppShellLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
};
