import {
  projectStatusStyleMap,
  type ProjectStatus
} from '../../types/project.types';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

/**
 * Reusable badge untuk project.status (5 status: Awaiting Consultant, In Progress,
 * On Hold, Completed, Cancelled). Mengkonsumsi `projectStatusStyleMap` sebagai
 * single source of truth untuk warna — lihat WFMS PRD bagian 11.1.
 */
export const ProjectStatusBadge = ({ status, className }: ProjectStatusBadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${projectStatusStyleMap[status]} ${className ?? ''}`.trim()}
  >
    {status}
  </span>
);
