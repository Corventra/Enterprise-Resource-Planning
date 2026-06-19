import { parseDateOnlyParts } from './format-date-only';

/** True when calendar due date is strictly before today (local). */
export const isDueDateOverdue = (value: string | null | undefined): boolean => {
  const parts = parseDateOnlyParts(value);
  if (parts) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(parts.y, parts.m - 1, parts.d);
    return dueDay < today;
  }

  if (!value) return false;
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return dueDay < today;
};
