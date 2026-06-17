import { parseDateOnlyParts } from '../../../utils/format-date-only';
import { isDueDateOverdue } from '../../../utils/is-due-date-overdue';
import type { InvoiceItem } from '../types/invoice.types';

export const isInvoiceListDueOverdue = (invoice: InvoiceItem): boolean =>
  invoice.statusDb !== 'SETTLED' && isDueDateOverdue(invoice.nextDueDate);

const compareDueDateValue = (a: string | null, b: string | null) => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const aParts = parseDateOnlyParts(a);
  const bParts = parseDateOnlyParts(b);
  if (aParts && bParts) {
    const aTime = new Date(aParts.y, aParts.m - 1, aParts.d).getTime();
    const bTime = new Date(bParts.y, bParts.m - 1, bParts.d).getTime();
    return aTime - bTime;
  }

  return new Date(a).getTime() - new Date(b).getTime();
};

export const compareInvoiceListRowsByDueDate = (a: InvoiceItem, b: InvoiceItem) => {
  const aOverdue = isInvoiceListDueOverdue(a);
  const bOverdue = isInvoiceListDueOverdue(b);
  if (aOverdue !== bOverdue) {
    return aOverdue ? -1 : 1;
  }

  if (aOverdue && bOverdue) {
    const overdueOrder = compareDueDateValue(a.nextDueDate, b.nextDueDate);
    if (overdueOrder !== 0) return overdueOrder;
  }

  return compareDueDateValue(a.nextDueDate, b.nextDueDate);
};
