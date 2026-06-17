import { isDueDateOverdue } from '../../../utils/is-due-date-overdue';

export const isLeadDueDateOverdue = (iso: string | null): boolean => isDueDateOverdue(iso);
const compareDueDateValue = (a: string | null, b: string | null) => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return new Date(a).getTime() - new Date(b).getTime();
};

export const compareLeadTrackerRowsByDueDate = (
  a: { dueDate: string | null; leadStatus: 'ACTIVE' | 'WON' | 'LOST' },
  b: { dueDate: string | null; leadStatus: 'ACTIVE' | 'WON' | 'LOST' }
) => {
  const aOverdue = isLeadDueDateOverdue(a.dueDate);
  const bOverdue = isLeadDueDateOverdue(b.dueDate);
  if (aOverdue !== bOverdue) {
    return aOverdue ? -1 : 1;
  }

  if (aOverdue && bOverdue) {
    const overdueOrder = compareDueDateValue(a.dueDate, b.dueDate);
    if (overdueOrder !== 0) return overdueOrder;
  }

  const statusRank = (status: typeof a.leadStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 0;
      case 'WON':
        return 1;
      case 'LOST':
        return 2;
      default:
        return 0;
    }
  };

  const statusOrder = statusRank(a.leadStatus) - statusRank(b.leadStatus);
  if (statusOrder !== 0) return statusOrder;

  return compareDueDateValue(a.dueDate, b.dueDate);
};
