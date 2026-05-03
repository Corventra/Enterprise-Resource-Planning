import { UserPlus, UserSquare2, Users } from 'lucide-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { ROLES } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { AssignConsultantDialog } from '../components/modals/assign-consultant-dialog';
import { projectService } from '../services/project-service';
import type { ProjectConsultant } from '../types/project.types';
import type { ProjectDetailOutletContext } from './project-detail-page';

const sectionClass = 'rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0]';
const sectionTitleClass = 'mb-4 text-lg font-bold text-[#003c90]';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const consultantLevelStyle: Record<string, string> = {
  Lead: 'bg-[#003c90]/10 text-[#003c90]',
  Senior: 'bg-[#4edea3]/30 text-[#004b31]',
  Junior: 'bg-amber-100 text-[#a16207]'
};

export const ProjectTeamPage = () => {
  const { project, refresh } = useOutletContext<ProjectDetailOutletContext>();
  const { role, user } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const isAssigningPm = role === ROLES.PM && user?.email === project.pm?.id;
  const canAssignConsultant =
    isAssigningPm && (project.status === 'Awaiting Consultant' || project.status === 'In Progress');

  const handleAssign = async (consultants: ProjectConsultant[], note?: string) => {
    if (!user || !role) return;
    setIsSubmitting(true);
    setErrorMessage(undefined);
    try {
      await projectService.assignConsultants(project.id, consultants, { name: user.name, role }, note);
      await refresh();
      setIsDialogOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal assign consultant. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Project Manager</h2>
        {project.pm ? (
          <div className="flex items-center gap-4 rounded-xl border border-[#eceef0] bg-[#f2f4f6] p-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#003c90] text-sm font-bold text-white">
              {initials(project.pm.name)}
            </span>
            <div>
              <p className="text-sm font-bold text-[#191c1e]">{project.pm.name}</p>
              <p className="text-xs font-medium text-[#737784]">Project Manager</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-[#a16207]">
            <UserSquare2 className="h-5 w-5" />
            <span>PM belum di-assign — menunggu COO menugaskan PM untuk project ini.</span>
          </div>
        )}
      </section>

      <section className={sectionClass}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className={sectionTitleClass}>Consultants</h2>
          {canAssignConsultant && (
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 sm:text-sm"
            >
              <UserPlus className="h-4 w-4" />
              Assign Consultant
            </button>
          )}
        </div>

        {project.consultants.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-[#a16207]">
            <Users className="h-5 w-5" />
            <span>Belum ada consultant — PM perlu menugaskan consultant agar project bisa berjalan.</span>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {project.consultants.map((consultant) => (
              <li
                key={consultant.id}
                className="flex items-center gap-4 rounded-xl border border-[#eceef0] bg-[#f2f4f6] p-4"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0f52ba] text-sm font-bold text-white">
                  {initials(consultant.name)}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#191c1e]">{consultant.name}</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${consultantLevelStyle[consultant.level] ?? 'bg-[#eceef0] text-[#434653]'}`}
                  >
                    {consultant.level}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AssignConsultantDialog
        open={isDialogOpen}
        projectCode={project.projectCode}
        client={project.client}
        alreadyAssigned={project.consultants}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onClose={() => {
          if (!isSubmitting) {
            setIsDialogOpen(false);
            setErrorMessage(undefined);
          }
        }}
        onAssign={handleAssign}
      />
    </div>
  );
};
