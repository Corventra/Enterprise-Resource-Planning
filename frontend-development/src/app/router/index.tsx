import { Routes, Route, Navigate } from 'react-router';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { DashboardPage } from '../../features/dashboard/pages/dashboard-page';
import { AppShellLayout } from '../layouts/app-shell-layout';
import { CampaignsPage } from '../../features/campaigns/pages/campaigns-page';
import { CampaignDetailPage } from '../../features/campaigns/pages/campaign-detail-page';
import { FormBuilderPage } from '../../features/forms/pages/form-builder-page';
import { FormPreviewPage } from '../../features/forms/pages/form-preview-page';
import { PublicFormPage } from '../../features/forms/pages/public-form-page';
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
import { DocumentCenterPage } from '../../features/document-center/pages/document-center-page';
import { ApprovalCenterPage } from '../../features/approval/pages/approval-center-page';
import { ApprovalEngagementLetterPage } from '../../features/approval/pages/approval-engagement-letter-page';
import { ApprovalHandoverPage } from '../../features/approval/pages/approval-handover-page';
import { ApprovalProposalPage } from '../../features/approval/pages/approval-proposal-page';
import { ProjectsPage } from '../../features/projects/pages/projects-page';
import { ProjectDetailPage } from '../../features/projects/pages/project-detail-page';
import { ProjectOverviewPage } from '../../features/projects/pages/project-overview-page';
import { ProjectTimelinePage } from '../../features/projects/pages/project-timeline-page';
import { ProjectTeamPage } from '../../features/projects/pages/project-team-page';
import { ProjectDocumentsPage } from '../../features/projects/pages/project-documents-page';
import { ProjectFinancialsPage } from '../../features/projects/pages/project-financials-page';
import { KpiCenterPage } from '../../features/kpi/pages/kpi-center-page';
import { KpiConsultantPage } from '../../features/kpi/pages/kpi-consultant-page';
import { SettingsPage } from '../../features/settings/pages/settings-page';
import { KpiConfigPage } from '../../features/settings/pages/kpi-config-page';
import { TaskTemplatesPage } from '../../features/settings/pages/task-templates-page';
import { MeetingsPage } from '../../features/meetings/pages/meetings-page';
import { UserManagementPage } from '../../features/admin/pages/user-management-page';
import { DepartmentManagementPage } from '../../features/admin/pages/department-management-page';
import { SystemSettingsPage } from '../../features/admin/pages/system-settings-page';
import { AuthGuard } from '../guards/auth-guard';
import { GuestGuard } from '../guards/guest-guard';
import { PermissionGuard } from '../guards/permission-guard';
import { PERMISSIONS, ROLES } from '../permissions';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/forms/public/:linkCode" element={<PublicFormPage />} />

      <Route element={<GuestGuard />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      <Route element={<AuthGuard />}>
        <Route element={<AppShellLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route
            element={
              <PermissionGuard permissions={[PERMISSIONS.CAMPAIGN_VIEW, PERMISSIONS.CAMPAIGN_MANAGE]} />
            }
          >
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/campaigns/:campaignId" element={<CampaignDetailPage />} />
          </Route>

          <Route element={<PermissionGuard permissions={[PERMISSIONS.FORM_VIEW, PERMISSIONS.FORM_MANAGE]} />}>
            <Route path="/campaigns/:campaignId/forms/new" element={<FormBuilderPage />} />
            <Route path="/campaigns/:campaignId/forms/:formId" element={<FormBuilderPage />} />
            <Route path="/campaigns/:campaignId/forms/:formId/preview" element={<FormPreviewPage />} />
            <Route path="/forms/:formId" element={<FormBuilderPage />} />
            <Route path="/forms/:formId/preview" element={<FormPreviewPage />} />
            <Route path="/forms" element={<Navigate to="/campaigns" replace />} />
          </Route>

          <Route element={<PermissionGuard permissions={[PERMISSIONS.BANK_DATA_VIEW]} />}>
            <Route path="/bank-data" element={<BankDataPage />} />
          </Route>

          <Route element={<PermissionGuard permissions={[PERMISSIONS.LEAD_TRACKER_VIEW]} />}>
            <Route path="/lead-tracker" element={<LeadTrackerPage />} />
          </Route>

          <Route element={<PermissionGuard roles={[ROLES.CEO, ROLES.BD]} />}>
            <Route path="/meetings" element={<MeetingsPage />} />
          </Route>

          <Route element={<PermissionGuard permissions={[PERMISSIONS.LEAD_VIEW]} />}>
            <Route path="/lead-workspace/:leadId" element={<LeadWorkspacePage />}>
              <Route index element={<Navigate to="meeting" replace />} />
              <Route path="meeting" element={<MeetingPage />} />
              <Route path="proposal" element={<ProposalPage />} />
              <Route path="engagement-letter" element={<EngagementLetterPage />} />
            </Route>
          </Route>

          <Route element={<PermissionGuard permissions={[PERMISSIONS.HANDOVER_MANAGE, PERMISSIONS.HANDOVER_APPROVE]} />}>
            <Route path="/handover" element={<HandoverPage />} />
            <Route path="/handover/:handoverId" element={<HandoverDetailPage />} />
            <Route path="/handover/:handoverId/edit" element={<HandoverUpdatePage />} />
          </Route>

          <Route element={<PermissionGuard permissions={[PERMISSIONS.INVOICE_MANAGE]} />}>
            <Route path="/invoice" element={<InvoicesPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/invoice/:invoiceId" element={<InvoiceDetailPage />} />
            <Route path="/invoices/:invoiceId" element={<InvoiceDetailPage />} />
          </Route>

          <Route element={<PermissionGuard permissions={[PERMISSIONS.DOCUMENT_VIEW]} />}>
            <Route path="/document-center" element={<DocumentCenterPage />} />
          </Route>

          <Route element={<PermissionGuard roles={[ROLES.CEO, ROLES.COO]} />}>
            <Route path="/approval" element={<ApprovalCenterPage />}>
              <Route index element={<Navigate to="proposal" replace />} />
              <Route path="proposal" element={<ApprovalProposalPage />} />
              <Route path="engagement-letter" element={<ApprovalEngagementLetterPage />} />
              <Route path="handover" element={<ApprovalHandoverPage />} />
            </Route>
          </Route>

          <Route element={<PermissionGuard permissions={[PERMISSIONS.PROJECT_VIEW]} />}>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<ProjectOverviewPage />} />
              <Route path="timeline" element={<ProjectTimelinePage />} />
              <Route path="team" element={<ProjectTeamPage />} />
              <Route path="documents" element={<ProjectDocumentsPage />} />
              <Route element={<PermissionGuard permissions={[PERMISSIONS.PROJECT_VIEW_FINANCIALS]} />}>
                <Route path="financials" element={<ProjectFinancialsPage />} />
              </Route>
            </Route>
          </Route>

          <Route
            element={
              <PermissionGuard
                permissions={[
                  PERMISSIONS.KPI_VIEW_OWN,
                  PERMISSIONS.KPI_VIEW_TEAM,
                  PERMISSIONS.KPI_VIEW_ALL
                ]}
              />
            }
          >
            <Route path="/kpi" element={<KpiCenterPage />} />
            <Route path="/kpi/consultant/:consultantId" element={<KpiConsultantPage />} />
          </Route>

          <Route path="/settings" element={<SettingsPage />} />
          <Route element={<PermissionGuard permissions={[PERMISSIONS.KPI_CONFIGURE]} />}>
            <Route path="/settings/kpi-config" element={<KpiConfigPage />} />
          </Route>
          <Route element={<PermissionGuard permissions={[PERMISSIONS.TASK_TEMPLATE_MANAGE]} />}>
            <Route path="/settings/task-templates" element={<TaskTemplatesPage />} />
          </Route>

          <Route element={<PermissionGuard permissions={[PERMISSIONS.USER_MANAGE]} />}>
            <Route path="/admin/users" element={<UserManagementPage />} />
          </Route>
          <Route element={<PermissionGuard permissions={[PERMISSIONS.DEPARTMENT_MANAGE]} />}>
            <Route path="/admin/departments" element={<DepartmentManagementPage />} />
          </Route>
          <Route element={<PermissionGuard permissions={[PERMISSIONS.SYSTEM_CONFIG]} />}>
            <Route path="/admin/system-settings" element={<SystemSettingsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};
