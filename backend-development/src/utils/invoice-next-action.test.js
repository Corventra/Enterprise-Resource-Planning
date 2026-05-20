const {
  buildInvoiceNextAction,
  deriveAccountStatus,
  deriveAccountNextDueDate,
  pickPriorityTerm
} = require('./invoice-next-action');

describe('invoice account next action & status', () => {
  const dpReady = {
    term_order: 1,
    term_name: 'Down Payment',
    term_type: 'DOWN_PAYMENT',
    status: 'READY_TO_ISSUE',
    due_date: '2026-05-21'
  };

  const finalDraft = {
    term_order: 3,
    term_name: 'Final',
    term_type: 'FINAL',
    status: 'DRAFT',
    billing_schedule_date: '2026-06-01',
    trigger_reference_value: null,
    trigger_confirmed_by: null,
    trigger_confirmed_at: null
  };

  it('prioritizes ISSUED over READY_TO_ISSUE', () => {
    const terms = [
      dpReady,
      {
        term_order: 2,
        term_name: 'Termin 1',
        term_type: 'INSTALLMENT',
        status: 'ISSUED',
        due_date: '2026-05-22'
      }
    ];
    expect(pickPriorityTerm(terms).status).toBe('ISSUED');
    expect(buildInvoiceNextAction(terms)).toBe('Kirim invoice Termin 1 ke client');
    expect(deriveAccountNextDueDate(terms)).toBe('2026-05-22');
    expect(deriveAccountStatus(terms)).toBe('AWAITING_PAYMENT');
  });

  it('uses READY_TO_ISSUE due_date when no higher priority', () => {
    const terms = [dpReady, finalDraft];
    expect(buildInvoiceNextAction(terms)).toBe('Generate invoice Down Payment');
    expect(deriveAccountNextDueDate(terms)).toBe('2026-05-21');
    expect(deriveAccountStatus(terms)).toBe('READY_TO_BILL');
  });

  it('returns SETTLED when all PAID', () => {
    const terms = [
      { term_order: 1, term_name: 'DP', status: 'PAID', due_date: null },
      { term_order: 2, term_name: 'Final', status: 'PAID', due_date: null }
    ];
    expect(buildInvoiceNextAction(terms)).toBe('Selesai');
    expect(deriveAccountStatus(terms)).toBe('SETTLED');
    expect(deriveAccountNextDueDate(terms)).toBeNull();
  });

  it('prioritizes OVERDUE over ISSUED', () => {
    const terms = [
      {
        term_order: 1,
        term_name: 'Termin 1',
        status: 'OVERDUE',
        due_date: '2026-05-01'
      },
      {
        term_order: 2,
        term_name: 'Termin 2',
        status: 'ISSUED',
        due_date: '2026-05-25'
      }
    ];
    expect(buildInvoiceNextAction(terms)).toBe('Follow up pembayaran overdue Termin 1');
    expect(deriveAccountStatus(terms)).toBe('OVERDUE');
  });
});
