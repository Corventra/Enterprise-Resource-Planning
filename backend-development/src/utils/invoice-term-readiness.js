/**
 * Shared rules for promoting invoice_terms from DRAFT to READY_TO_ISSUE.
 */

/**
 * @param {Array<{ term_order?: number, status?: string }>} terms
 * @param {{ term_order?: number }} currentTerm
 */
const arePreviousTermsPaid = (terms, currentTerm) => {
  const currentOrder = Number(currentTerm?.term_order);
  if (!Number.isFinite(currentOrder)) return false;

  const previous = terms.filter((t) => Number(t.term_order) < currentOrder);
  if (previous.length === 0) return true;

  return previous.every((t) => t.status === 'PAID');
};

/**
 * @param {import('mysql2/promise').PoolConnection} conn
 * @param {number} accountId
 * @param {number} termOrder
 */
const hasAllPreviousTermsPaid = async (conn, accountId, termOrder) => {
  const order = Number(termOrder);
  if (!Number.isSafeInteger(accountId) || accountId <= 0 || !Number.isFinite(order)) {
    return false;
  }

  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS unpaid_count
       FROM invoice_terms
      WHERE account_id = ?
        AND term_order < ?
        AND status <> 'PAID'`,
    [accountId, order]
  );

  return Number(rows[0]?.unpaid_count ?? 0) === 0;
};

module.exports = {
  arePreviousTermsPaid,
  hasAllPreviousTermsPaid
};
