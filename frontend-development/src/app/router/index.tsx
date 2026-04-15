import { Routes, Route, Navigate } from 'react-router';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { AppShellLayout } from '../layouts/app-shell-layout';
import { CampaignsPage } from '../../features/campaigns/pages/campaigns-page';
import { CampaignDetailPage } from '../../features/campaigns/pages/campaign-detail-page';
import { FormBuilderPage } from '../../features/forms/pages/form-builder-page';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<AppShellLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/campaigns/:campaignId" element={<CampaignDetailPage />} />
        <Route path="/forms" element={<FormBuilderPage />} />
        <Route path="/forms/:formId" element={<FormBuilderPage />} />
      </Route>
    </Routes>
  );
};
