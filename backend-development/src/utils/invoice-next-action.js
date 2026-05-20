const { arePreviousTermsPaid } = require('./invoice-term-readiness');
const { formatSqlDate } = require('./sql-date');

/**
 * Priority among unfinished terms (status !== PAID), lowest term_order on ties:
 *   OVERDUE > ISSUED > READY_TO_ISSUE > SENT > DRAFT
 */
const TERM_PRIORITY = {
  OVERDUE: 1,
  ISSUED: 2,
  READY_TO_ISSUE: 3,
  SENT: 4,
  DRAFT: 5
};

const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isBillingScheduleReached = (billingScheduleDate) => {
  const scheduled = formatSqlDate(billingScheduleDate);
  if (!scheduled) return true;
  return scheduled <= todayYmd();
};

const isTriggerConfirmed = (term) => {
  const ref = term?.trigger_reference_value;
  if (ref == null || String(ref).trim() === '') return false;
  if (term.trigger_confirmed_by == null) return false;
  if (term.trigger_confirmed_at == null) return false;
  return true;
};

const draftActionForTerm = (term, allTerms) => {
  const name = term.term_name || 'termin';
  const type = term.term_type;

  if (type === 'INSTALLMENT') {
    if (term.billing_schedule_date && !isBillingScheduleReached(term.billing_schedule_date)) {
      return `Menunggu jadwal penagihan ${name}`;
    }
    if (!arePreviousTermsPaid(allTerms, term)) {
      return 'Menunggu pembayaran termin sebelumnya';
    }
  }

  if (type === 'FINAL') {
    if (!isTriggerConfirmed(term)) {
      return 'Menunggu project selesai';
    }
    if (term.billing_schedule_date && !isBillingScheduleReached(term.billing_schedule_date)) {
      return 'Menunggu jadwal final billing';
    }
    if (!arePreviousTermsPaid(allTerms, term)) {
      return 'Menunggu pembayaran termin sebelumnya';
    }
  }

  return 'Menunggu syarat penagihan';
};

const actionForTerm = (term, allTerms) => {
  const name = term.term_name || 'termin';
  switch (term.status) {
    case 'OVERDUE':
      return `Follow up pembayaran overdue ${name}`;
    case 'ISSUED':
      return `Kirim invoice ${name} ke client`;
    case 'READY_TO_ISSUE':
      return `Generate invoice ${name}`;
    case 'SENT':
      return `Follow up pembayaran ${name}`;
    case 'DRAFT':
      return draftActionForTerm(term, allTerms);
    default:
      return 'Menunggu syarat penagihan';
  }
};

const pickPriorityTerm = (terms) => {
  if (!Array.isArray(terms) || terms.length === 0) {
    return null;
  }

  const unfinished = terms.filter((t) => t.status !== 'PAID');
  if (unfinished.length === 0) {
    return null;
  }

  const ranked = [...unfinished].sort((a, b) => {
    const pa = TERM_PRIORITY[a.status] ?? 99;
    const pb = TERM_PRIORITY[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    return (Number(a.term_order) || 0) - (Number(b.term_order) || 0);
  });

  return ranked[0];
};

const resolveNextDueDateForTerm = (term) => {
  if (!term || term.status === 'PAID') {
    return null;
  }

  if (term.status === 'DRAFT') {
    if (term.billing_schedule_date) {
      return formatSqlDate(term.billing_schedule_date);
    }
    return null;
  }

  return formatSqlDate(term.due_date);
};

const deriveAccountStatus = (terms) => {
  if (!Array.isArray(terms) || terms.length === 0) {
    return 'READY_TO_BILL';
  }

  if (terms.every((t) => t.status === 'PAID')) {
    return 'SETTLED';
  }
  if (terms.some((t) => t.status === 'OVERDUE')) {
    return 'OVERDUE';
  }
  if (terms.some((t) => t.status === 'ISSUED' || t.status === 'SENT')) {
    return 'AWAITING_PAYMENT';
  }
  if (terms.some((t) => t.status === 'READY_TO_ISSUE' || t.status === 'DRAFT')) {
    return 'READY_TO_BILL';
  }

  return 'READY_TO_BILL';
};

const buildInvoiceNextAction = (terms) => {
  if (!Array.isArray(terms) || terms.length === 0) {
    return 'Selesai';
  }

  if (terms.every((t) => t.status === 'PAID')) {
    return 'Selesai';
  }

  const priorityTerm = pickPriorityTerm(terms);
  return priorityTerm ? actionForTerm(priorityTerm, terms) : 'Selesai';
};

const deriveAccountNextDueDate = (terms) => {
  const priorityTerm = pickPriorityTerm(terms);
  return resolveNextDueDateForTerm(priorityTerm);
};

module.exports = {
  TERM_PRIORITY,
  pickPriorityTerm,
  actionForTerm,
  resolveNextDueDateForTerm,
  deriveAccountStatus,
  deriveAccountNextDueDate,
  buildInvoiceNextAction
};
