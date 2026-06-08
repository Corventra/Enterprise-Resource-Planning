import {
  projectMilestoneStatusStyleMap,
  type ProjectMilestoneStatus
} from '../../types/project.types';

interface MilestoneStatusBadgeProps {
  status: ProjectMilestoneStatus;
  className?: string;
}

/**
 * Reusable badge untuk milestone.status (4 status: Pending, In Progress, Done,
 * Blocked). Mengkonsumsi `projectMilestoneStatusStyleMap` sebagai single source
 * of truth untuk warna — lihat WFMS PRD bagian 11.1.
 */
export const MilestoneStatusBadge = ({ status, className }: MilestoneStatusBadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${projectMilestoneStatusStyleMap[status]} ${className ?? ''}`.trim()}
  >
    {status}
  </span>
);
