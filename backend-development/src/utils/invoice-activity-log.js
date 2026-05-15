const { INVOICE_ACTIVITY_TYPES } = require('../constants/invoice-activity-types');

const normalizeCreatedBy = (userId) => {
  const n = Number(userId);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

const formatAmountId = (amount) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
};

/**
 * @param {import('mysql2/promise').PoolConnection} conn
 */
const insertInvoiceActivityLog = async (
  conn,
  { accountId, invoiceId = null, activityType, title, description, createdBy = null }
) => {
  const account = Number(accountId);
  if (!Number.isSafeInteger(account) || account <= 0) return;

  const invoice =
    invoiceId != null && Number.isSafeInteger(Number(invoiceId)) && Number(invoiceId) > 0
      ? Number(invoiceId)
      : null;

  await conn.execute(
    `INSERT INTO invoice_activity_logs (
        account_id,
        invoice_id,
        activity_type,
        title,
        description,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      account,
      invoice,
      activityType,
      String(title).slice(0, 255),
      description != null ? String(description) : null,
      normalizeCreatedBy(createdBy)
    ]
  );
};

const hasInvoiceActivityLog = async (conn, { accountId, invoiceId, activityType }) => {
  if (invoiceId != null) {
    const [rows] = await conn.execute(
      `SELECT 1
         FROM invoice_activity_logs
        WHERE invoice_id = ?
          AND activity_type = ?
        LIMIT 1`,
      [invoiceId, activityType]
    );
    return Boolean(rows[0]);
  }

  const [rows] = await conn.execute(
    `SELECT 1
       FROM invoice_activity_logs
      WHERE account_id = ?
        AND activity_type = ?
        AND invoice_id IS NULL
      LIMIT 1`,
    [accountId, activityType]
  );
  return Boolean(rows[0]);
};

const logAccountSettledIfNeeded = async (conn, accountId, createdBy) => {
  const [rows] = await conn.execute(
    `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) AS paid_count
       FROM invoice_terms
      WHERE account_id = ?`,
    [accountId]
  );
  const total = Number(rows[0]?.total ?? 0);
  const paidCount = Number(rows[0]?.paid_count ?? 0);
  if (total <= 0 || paidCount !== total) {
    return false;
  }

  const alreadyLogged = await hasInvoiceActivityLog(conn, {
    accountId,
    invoiceId: null,
    activityType: INVOICE_ACTIVITY_TYPES.INVOICE_ACCOUNT_SETTLED
  });
  if (alreadyLogged) {
    return false;
  }

  await insertInvoiceActivityLog(conn, {
    accountId,
    invoiceId: null,
    activityType: INVOICE_ACTIVITY_TYPES.INVOICE_ACCOUNT_SETTLED,
    title: 'Akun invoice selesai',
    description: 'Seluruh termin invoice telah lunas.',
    createdBy
  });
  return true;
};

module.exports = {
  INVOICE_ACTIVITY_TYPES,
  insertInvoiceActivityLog,
  hasInvoiceActivityLog,
  logAccountSettledIfNeeded,
  formatAmountId
};
