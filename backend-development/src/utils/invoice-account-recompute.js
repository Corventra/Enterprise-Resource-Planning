const {
  deriveAccountStatus,
  deriveAccountNextDueDate
} = require('./invoice-next-action');

/**
 * Recompute invoice_accounts derived fields from current invoice_terms + payments.
 */
const recomputeInvoiceAccountDerived = async (conn, accountId) => {
  const [termRows] = await conn.execute(
    `SELECT
        status,
        due_date,
        billing_schedule_date,
        term_name,
        term_type,
        term_order,
        trigger_reference_value,
        trigger_confirmed_by,
        trigger_confirmed_at
       FROM invoice_terms
      WHERE account_id = ?
      ORDER BY term_order ASC, invoice_id ASC`,
    [accountId]
  );

  const total = termRows.length;
  const paid = termRows.filter((t) => t.status === 'PAID').length;
  const progressSummary = total > 0 ? `${paid}/${total} Paid` : null;

  const status = deriveAccountStatus(termRows);
  const nextDueDate = deriveAccountNextDueDate(termRows);

  const [paidSumRows] = await conn.execute(
    `SELECT COALESCE(SUM(ip.amount_received_net), 0) AS total_paid
       FROM invoice_payments ip
       INNER JOIN invoice_terms it ON it.invoice_id = ip.invoice_id
      WHERE it.account_id = ?
        AND ip.status = 'VERIFIED'`,
    [accountId]
  );
  const totalPaidNet = Number(paidSumRows[0]?.total_paid ?? 0);

  const [billRows] = await conn.execute(
    `SELECT total_bill_net FROM invoice_accounts WHERE account_id = ? LIMIT 1`,
    [accountId]
  );
  const totalBillNet = Number(billRows[0]?.total_bill_net ?? 0);
  const totalOutstandingNet = Math.max(0, totalBillNet - totalPaidNet);

  await conn.execute(
    `UPDATE invoice_accounts
        SET progress_summary = ?,
            status = ?,
            next_due_date = ?,
            total_paid_net = ?,
            total_outstanding_net = ?,
            updated_at = CURRENT_TIMESTAMP
      WHERE account_id = ?`,
    [progressSummary, status, nextDueDate, totalPaidNet, totalOutstandingNet, accountId]
  );
};

const recomputeInvoiceAccountsDerived = async (conn, accountIds) => {
  if (!accountIds.length) return;
  const unique = [...new Set(accountIds)];
  for (const accountId of unique) {
    await recomputeInvoiceAccountDerived(conn, accountId);
  }
};

const collectDistinctAccountIds = async (conn, accountIdFilter) => {
  if (accountIdFilter != null) {
    return [accountIdFilter];
  }
  const [rows] = await conn.execute(`SELECT account_id FROM invoice_accounts`);
  return rows.map((r) => r.account_id);
};

module.exports = {
  recomputeInvoiceAccountDerived,
  recomputeInvoiceAccountsDerived,
  collectDistinctAccountIds
};
