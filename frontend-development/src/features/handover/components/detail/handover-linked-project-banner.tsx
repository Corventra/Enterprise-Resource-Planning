import { ArrowRight, Briefcase } from 'lucide-react';
import { Link } from 'react-router';
import { projectStatusStyleMap, type Project } from '../../../projects/types/project.types';

interface HandoverLinkedProjectBannerProps {
  project: Project;
}

export const HandoverLinkedProjectBanner = ({ project }: HandoverLinkedProjectBannerProps) => {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#003c90]/20 bg-gradient-to-r from-[#d5e3fc]/60 to-white p-4 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-center gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#003c90]/10">
          <Briefcase className="h-5 w-5 text-[#003c90]" strokeWidth={2} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#737784]">Linked Project</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-[#003c90]">{project.projectCode}</span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${projectStatusStyleMap[project.status]}`}
            >
              {project.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#434653]">
            PM: <span className="font-semibold">{project.pm?.name ?? 'Unassigned'}</span>
            <span className="text-[#737784]">
              {' '}
              · {project.consultants.length} consultant{project.consultants.length === 1 ? '' : 's'}
            </span>
          </p>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#003c90] px-3 py-2 text-xs font-bold text-white shadow-sm">
        Open Project
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
};
