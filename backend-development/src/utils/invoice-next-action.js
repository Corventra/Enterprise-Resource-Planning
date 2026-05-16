/**
 * Derives operational next_action from invoice terms (lowest term_order first on ties).
 * Priority among unfinished terms (status !== PAID):
 *   OVERDUE > READY_TO_ISSUE > ISSUED > SENT (not overdue) > DRAFT
 */
const TERM_PRIORITY = {
  OVERDUE: 1,
  READY_TO_ISSUE: 2,
  ISSUED: 3,
  SENT: 4,
  DRAFT: 5
};

const actionForTerm = (term) => {
  const name = term.term_name || 'termin';
  switch (term.status) {
    case 'READY_TO_ISSUE':
      return `Generate invoice ${name}`;
    case 'ISSUED':
      return `Kirim invoice ${name}`;
    case 'SENT':
      return `Tunggu pembayaran ${name}`;
    case 'OVERDUE':
      return `Follow up pembayaran ${name}`;
    case 'DRAFT':
      return `Siapkan termin ${name}`;
    default:
      return `Tindak lanjuti ${name}`;
  }
};

const buildInvoiceNextAction = (terms) => {
  if (!Array.isArray(terms) || terms.length === 0) {
    return 'Selesai';
  }

  const allPaid = terms.every((t) => t.status === 'PAID');
  if (allPaid) {
    return 'Selesai';
  }

  const unfinished = terms.filter((t) => t.status !== 'PAID');
  const ranked = [...unfinished].sort((a, b) => {
    const pa = TERM_PRIORITY[a.status] ?? 99;
    const pb = TERM_PRIORITY[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    return (a.term_order ?? 0) - (b.term_order ?? 0);
  });

  return actionForTerm(ranked[0]);
};

module.exports = { buildInvoiceNextAction };
