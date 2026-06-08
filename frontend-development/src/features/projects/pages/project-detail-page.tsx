import { Navigate, Outlet, useNavigate, useParams } from 'react-router';
import type { HandoverDetail } from '../../handover/types/handover.types';
import { ProjectDetailHeader } from '../components/detail/project-detail-header';
import { ProjectLifecycleActions } from '../components/detail/project-lifecycle-actions';
import { ProjectTabs } from '../components/detail/project-tabs';
import { useProjectDetail } from '../hooks/use-project-detail';
import type { Project } from '../types/project.types';

export type ProjectDetailOutletContext = {
  project: Project;
  handover: HandoverDetail | undefined;
  refresh: () => Promise<void>;
};

export const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { project, handover, isLoading, refresh } = useProjectDetail(projectId);

  if (!projectId) {
    return <Navigate to="/projects" replace />;
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading project detail...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 shadow-sm">
        <h1 className="text-base font-semibold text-[#191c1e]">Project not found</h1>
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="mt-3 rounded-lg border border-[#c3c6d5] px-3 py-1.5 text-xs font-medium text-[#191c1e] hover:bg-[#eceef0] sm:text-sm"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ProjectDetailHeader project={project} onBack={() => navigate('/projects')} />
      <ProjectLifecycleActions project={project} onAction={refresh} />
      <ProjectTabs projectId={project.id} />
      <Outlet context={{ project, handover, refresh } satisfies ProjectDetailOutletContext} />
    </div>
  );
};
