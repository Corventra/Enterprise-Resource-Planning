import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../../app/store/auth-store';
import { AssignPMDialog } from '../../projects/components/modals/assign-pm-dialog';
import { projectService } from '../../projects/services/project-service';
import type { ProjectAssignee } from '../../projects/types/project.types';
import { HandoverApprovalTrail } from '../components/detail/handover-approval-trail';
import { HandoverDetailHeader } from '../components/detail/handover-detail-header';
import { HandoverDocumentSections } from '../components/detail/handover-document-sections';
import { HandoverLinkedProjectBanner } from '../components/detail/handover-linked-project-banner';
import { HandoverQuickNavigation } from '../components/detail/handover-quick-navigation';
import { useHandoverDetail } from '../hooks/use-handover-detail';

export const HandoverDetailPage = () => {
  const navigate = useNavigate();
  const { handoverId } = useParams();
  const { user, role } = useAuth();
  const { detail, linkedProject, isLoading } = useHandoverDetail(handoverId);

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | undefined>();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading handover detail...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 shadow-sm">
        <h1 className="text-base font-semibold text-[#191c1e]">Handover not found</h1>
        <button
          type="button"
          onClick={() => navigate('/handover')}
          className="mt-3 rounded-lg border border-[#c3c6d5] px-3 py-1.5 text-xs font-medium text-[#191c1e] hover:bg-[#eceef0] sm:text-sm"
        >
          Back to Handover List
        </button>
      </div>
    );
  }

  const handleAssignPM = async (pm: ProjectAssignee, note?: string) => {
    if (!user || !role) return;
    setIsAssigning(true);
    setAssignError(undefined);
    try {
      const project = await projectService.createFromHandover(detail.id, pm, { name: user.name, role }, note);
      setIsAssignDialogOpen(false);
      navigate(`/projects/${project.id}`);
    } catch (error) {
      setAssignError(error instanceof Error ? error.message : 'Gagal assign PM. Coba lagi.');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-5">
      <HandoverDetailHeader
        status={detail.status}
        onBack={() => navigate('/handover')}
        onEdit={() => navigate(`/handover/${detail.id}/edit`)}
        onAssignPM={() => setIsAssignDialogOpen(true)}
      />

      {linkedProject && <HandoverLinkedProjectBanner project={linkedProject} />}

      <HandoverApprovalTrail status={detail.status} entries={detail.approvalTrail ?? []} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
        <div className="sticky top-20 self-start md:col-span-2">
          <HandoverQuickNavigation />
        </div>
        <div className="md:col-span-10">
          <HandoverDocumentSections detail={detail} />
        </div>
      </div>

      <AssignPMDialog
        open={isAssignDialogOpen}
        handoverDocCode={detail.docCode}
        client={detail.projectInformation.find((info) => info.label === 'Client Name')?.value ?? '-'}
        isSubmitting={isAssigning}
        errorMessage={assignError}
        onClose={() => {
          if (!isAssigning) {
            setIsAssignDialogOpen(false);
            setAssignError(undefined);
          }
        }}
        onAssign={handleAssignPM}
      />
    </div>
  );
};
