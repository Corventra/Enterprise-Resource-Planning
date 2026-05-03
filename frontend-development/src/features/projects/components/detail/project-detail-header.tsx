import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router';
import { ROLES } from '../../../../app/permissions';
import { useAuth } from '../../../../app/store/auth-store';
import { projectStatusStyleMap, type Project } from '../../types/project.types';

interface ProjectDetailHeaderProps {
  project: Project;
  onBack: () => void;
}

const formatPeriod = (start: string, end: string) => {
  const fmt = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  return `${fmt(start)} – ${fmt(end)}`;
};

export const ProjectDetailHeader = ({ project, onBack }: ProjectDetailHeaderProps) => {
  const { role } = useAuth();
  const canSeeHandover =
    role === ROLES.BD || role === ROLES.CEO || role === ROLES.COO || role === ROLES.STAFF_ADMIN;

  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col items-start">
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center text-xs font-medium text-[#434653] transition-colors hover:text-[#003c90] sm:text-sm"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 sm:h-4 sm:w-4" />
          Back to Projects
        </button>
        <div className="mt-2 mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-[#d5e3fc] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#57657a] sm:text-[11px]">
            ID: {project.projectCode}
          </span>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${projectStatusStyleMap[project.status]}`}
          >
            {project.status}
          </span>
          <span className="inline-flex rounded-full bg-[#eceef0] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#434653]">
            {project.serviceLine}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#191c1e] sm:text-3xl">{project.client}</h1>
        <p className="mt-1 text-sm text-[#737784]">
          {project.projectName} · {formatPeriod(project.startDate, project.endDate)}
        </p>
      </div>

      {canSeeHandover && (
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/handover/${project.handoverId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[#f2f4f6] px-4 py-2.5 text-sm font-semibold text-[#191c1e] transition-colors hover:bg-[#e6e8ea]"
          >
            <FileText className="h-4 w-4" />
            View Handover Memo
          </Link>
        </div>
      )}
    </header>
  );
};
