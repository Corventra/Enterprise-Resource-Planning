import { Routes, Route, Navigate } from 'react-router';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { AppShellLayout } from '../layouts/app-shell-layout';
import { CampaignsPage } from '../../features/campaigns/pages/campaigns-page';
import { CampaignDetailPage } from '../../features/campaigns/pages/campaign-detail-page';
import { FormBuilderPage } from '../../features/forms/pages/form-builder-page';
import { BankDataPage } from '../../features/bank-data/pages/bank-data-page';
import { LeadTrackerPage } from '../../features/lead-tracker/pages/lead-tracker-page';
import { LeadWorkspacePage } from '../../features/lead-workspace/pages/lead-workspace-page';
import { MeetingPage } from '../../features/lead-workspace/pages/meeting-page';
import { ProposalPage } from '../../features/lead-workspace/pages/proposal-page';
import { EngagementLetterPage } from '../../features/lead-workspace/pages/engagement-letter-page';
import { HandoverPage } from '../../features/handover/pages/handover-page';
import { HandoverDetailPage } from '../../features/handover/pages/handover-detail-page';
import { HandoverUpdatePage } from '../../features/handover/pages/handover-update-page';
import { InvoicesPage } from '../../features/invoices/pages/invoices-page';
import { InvoiceDetailPage } from '../../features/invoices/pages/invoice-detail-page';

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
        <Route path="/bank-data" element={<BankDataPage />} />
        <Route path="/lead-tracker" element={<LeadTrackerPage />} />
        <Route path="/handover" element={<HandoverPage />} />
        <Route path="/handover/:handoverId" element={<HandoverDetailPage />} />
        <Route path="/handover/:handoverId/edit" element={<HandoverUpdatePage />} />
        <Route path="/invoice" element={<InvoicesPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoice/:invoiceId" element={<InvoiceDetailPage />} />
        <Route path="/invoices/:invoiceId" element={<InvoiceDetailPage />} />
        <Route path="/lead-workspace/:leadId" element={<LeadWorkspacePage />}>
          <Route index element={<Navigate to="meeting" replace />} />
          <Route path="meeting" element={<MeetingPage />} />
          <Route path="proposal" element={<ProposalPage />} />
          <Route path="engagement-letter" element={<EngagementLetterPage />} />
        </Route>
        <Route path="/forms" element={<FormBuilderPage />} />
        <Route path="/forms/:formId" element={<FormBuilderPage />} />
      </Route>
    </Routes>
  );
};
