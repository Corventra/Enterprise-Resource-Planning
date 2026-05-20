const { pool } = require('../config/db');
const {
  recomputeInvoiceAccountsDerived,
  collectDistinctAccountIds
} = require('./invoice-account-recompute');
const {
  INVOICE_ACTIVITY_TYPES,
  insertInvoiceActivityLog
} = require('./invoice-activity-log');
const { hasAllPreviousTermsPaid } = require('./invoice-term-readiness');

const accountFilterSql = (accountId, alias = 'it') =>
  accountId != null ? ` AND ${alias}.account_id = ?` : '';

const accountFilterParams = (accountId) => (accountId != null ? [accountId] : []);

/** Operational deadline for admin to generate invoice (not client payment due). */
const READY_TO_ISSUE_DUE_DATE_SQL = 'DATE_ADD(CURDATE(), INTERVAL 1 DAY)';

/**
 * READY_TO_ISSUE terms must carry due_date = H+1 (batas generate invoice).
 */
const ensureReadyToIssueDueDates = async (conn, accountId = null) => {
  const params = accountFilterParams(accountId);
  await conn.execute(
    `UPDATE invoice_terms it
        SET it.due_date = ${READY_TO_ISSUE_DUE_DATE_SQL},
            it.updated_at = CURRENT_TIMESTAMP
      WHERE it.status = 'READY_TO_ISSUE'
        AND it.due_date IS NULL
        ${accountFilterSql(accountId, 'it')}`,
    params
  );
};

/**
 * SENT -> OVERDUE when due_date < today and not yet PAID.
 */
const applyOverdueStatusIfNeeded = async (conn, accountId = null) => {
  const params = [INVOICE_ACTIVITY_TYPES.INVOICE_OVERDUE, ...accountFilterParams(accountId)];
  const [candidates] = await conn.execute(
    `SELECT it.invoice_id, it.account_id, it.term_name
       FROM invoice_terms it
      WHERE it.status = 'SENT'
        AND it.due_date IS NOT NULL
        AND it.due_date < CURDATE()
        AND NOT EXISTS (
          SELECT 1
            FROM invoice_activity_logs l
           WHERE l.invoice_id = it.invoice_id
             AND l.activity_type = ?
        )
        ${accountFilterSql(accountId, 'it')}`,
    params
  );

  if (candidates.length === 0) {
    return;
  }

  const invoiceIds = candidates.map((r) => r.invoice_id);
  const placeholders = invoiceIds.map(() => '?').join(', ');
  await conn.execute(
    `UPDATE invoice_terms
        SET status = 'OVERDUE',
            updated_at = CURRENT_TIMESTAMP
      WHERE invoice_id IN (${placeholders})
        AND status = 'SENT'`,
    invoiceIds
  );

  for (const row of candidates) {
    await insertInvoiceActivityLog(conn, {
      accountId: row.account_id,
      invoiceId: row.invoice_id,
      activityType: INVOICE_ACTIVITY_TYPES.INVOICE_OVERDUE,
      title: 'Invoice melewati jatuh tempo',
      description: `Invoice ${row.term_name} telah melewati jatuh tempo pembayaran.`,
      createdBy: null
    });
  }
};

/**
 * INSTALLMENT: DRAFT -> READY_TO_ISSUE when schedule reached and all lower term_order are PAID.
 */
const applyInstallmentScheduleActivation = async (conn, accountId = null) => {
  const params = accountFilterParams(accountId);
  const [candidates] = await conn.execute(
    `SELECT it.invoice_id, it.account_id, it.term_order
       FROM invoice_terms it
      WHERE it.status = 'DRAFT'
        AND it.term_type = 'INSTALLMENT'
        AND it.billing_schedule_date IS NOT NULL
        AND it.billing_schedule_date <= CURDATE()
        ${accountFilterSql(accountId, 'it')}`,
    params
  );

  for (const row of candidates) {
    const previousPaid = await hasAllPreviousTermsPaid(conn, row.account_id, row.term_order);
    if (!previousPaid) {
      continue;
    }

    await conn.execute(
      `UPDATE invoice_terms
          SET status = 'READY_TO_ISSUE',
              due_date = ${READY_TO_ISSUE_DUE_DATE_SQL},
              updated_at = CURRENT_TIMESTAMP
        WHERE invoice_id = ?
          AND status = 'DRAFT'
          AND term_type = 'INSTALLMENT'`,
      [row.invoice_id]
    );
  }
};

/**
 * FINAL: DRAFT -> READY_TO_ISSUE when trigger confirmed, schedule reached (if set),
 * and all lower term_order are PAID.
 */
const applyFinalTriggeredActivation = async (conn, accountId = null) => {
  const params = accountFilterParams(accountId);
  const [candidates] = await conn.execute(
    `SELECT it.invoice_id, it.account_id, it.term_order
       FROM invoice_terms it
      WHERE it.status = 'DRAFT'
        AND it.term_type = 'FINAL'
        AND it.trigger_reference_value IS NOT NULL
        AND TRIM(it.trigger_reference_value) <> ''
        AND it.trigger_confirmed_by IS NOT NULL
        AND it.trigger_confirmed_at IS NOT NULL
        AND (it.billing_schedule_date IS NULL OR it.billing_schedule_date <= CURDATE())
        ${accountFilterSql(accountId, 'it')}`,
    params
  );

  for (const row of candidates) {
    const previousPaid = await hasAllPreviousTermsPaid(conn, row.account_id, row.term_order);
    if (!previousPaid) {
      continue;
    }

    await conn.execute(
      `UPDATE invoice_terms
          SET status = 'READY_TO_ISSUE',
              due_date = ${READY_TO_ISSUE_DUE_DATE_SQL},
              updated_at = CURRENT_TIMESTAMP
        WHERE invoice_id = ?
          AND status = 'DRAFT'
          AND term_type = 'FINAL'`,
      [row.invoice_id]
    );
  }
};

/**
 * RETAINER: promote earliest eligible DRAFT term when schedule reached and previous terms PAID;
 * only one RETAINER may be READY_TO_ISSUE per account at a time.
 */
const applyRetainerScheduleActivation = async (conn, accountId = null) => {
  const filterParams = accountFilterParams(accountId);

  const [readyRows] = await conn.execute(
    `SELECT DISTINCT it.account_id
       FROM invoice_terms it
      WHERE it.term_type = 'RETAINER'
        AND it.status = 'READY_TO_ISSUE'
        ${accountFilterSql(accountId, 'it')}`,
    filterParams
  );
  const accountsWithReadyRetainer = new Set(readyRows.map((r) => r.account_id));

  const [draftRows] = await conn.execute(
    `SELECT it.invoice_id, it.account_id, it.term_order
       FROM invoice_terms it
      WHERE it.term_type = 'RETAINER'
        AND it.status = 'DRAFT'
        AND it.billing_schedule_date IS NOT NULL
        AND it.billing_schedule_date <= CURDATE()
        ${accountFilterSql(accountId, 'it')}`,
    filterParams
  );

  const candidateByAccount = new Map();
  for (const row of draftRows) {
    if (accountsWithReadyRetainer.has(row.account_id)) {
      continue;
    }

    const previousPaid = await hasAllPreviousTermsPaid(conn, row.account_id, row.term_order);
    if (!previousPaid) {
      continue;
    }

    const current = candidateByAccount.get(row.account_id);
    if (!current || row.term_order < current.term_order) {
      candidateByAccount.set(row.account_id, row);
    }
  }

  for (const candidate of candidateByAccount.values()) {
    await conn.execute(
      `UPDATE invoice_terms
          SET status = 'READY_TO_ISSUE',
              due_date = ${READY_TO_ISSUE_DUE_DATE_SQL},
              updated_at = CURRENT_TIMESTAMP
        WHERE invoice_id = ?
          AND term_type = 'RETAINER'
          AND status = 'DRAFT'`,
      [candidate.invoice_id]
    );
  }
};

/**
 * Run lifecycle promotions + overdue, then recompute affected invoice_accounts.
 * @param {import('mysql2/promise').PoolConnection} conn
 * @param {number|null} accountId - null = all accounts
 */
const syncInvoiceTermLifecycle = async (conn, accountId = null) => {
  await applyOverdueStatusIfNeeded(conn, accountId);
  await applyInstallmentScheduleActivation(conn, accountId);
  await applyRetainerScheduleActivation(conn, accountId);
  await applyFinalTriggeredActivation(conn, accountId);
  await ensureReadyToIssueDueDates(conn, accountId);

  const accountIds = await collectDistinctAccountIds(conn, accountId);
  await recomputeInvoiceAccountsDerived(conn, accountIds);
};

/**
 * Read-path sync (list/detail) — commits status changes to DB.
 */
const syncInvoiceTermLifecycleForRead = async (accountId = null) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await syncInvoiceTermLifecycle(conn, accountId);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

module.exports = {
  applyOverdueStatusIfNeeded,
  applyInstallmentScheduleActivation,
  applyRetainerScheduleActivation,
  applyFinalTriggeredActivation,
  ensureReadyToIssueDueDates,
  syncInvoiceTermLifecycle,
  syncInvoiceTermLifecycleForRead
};
