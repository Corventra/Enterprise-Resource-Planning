const { pool } = require('../config/db');
const { buildInvoiceNumber } = require('../utils/invoice-number');
const { formatSqlDate, sqlDateToLocalDate } = require('../utils/sql-date');
const { syncInvoiceTermLifecycle } = require('../utils/invoice-term-lifecycle');
const {
  INVOICE_ACTIVITY_TYPES,
  insertInvoiceActivityLog,
  logAccountSettledIfNeeded,
  formatAmountId
} = require('../utils/invoice-activity-log');
const { findInvoiceAccountDetail } = require('./invoice.repo');
const { markDpReceivedChecklistPaid } = require('../utils/handover-checklist');

const normalizeInvoiceId = (invoiceId) => {
  const n = Number(invoiceId);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
};

const PAYMENT_METHODS = new Set(['BANK_TRANSFER', 'CASH', 'GIRO', 'CHEQUE', 'OTHER']);

const DEFAULT_PROJECT_COMPLETION_REFERENCE = 'Project completed';

const normalizePaymentMethod = (raw) => {
  if (raw == null) return null;
  const s = String(raw).trim().toUpperCase();
  return PAYMENT_METHODS.has(s) ? s : null;
};

const normalizeTransactionDate = (raw) => {
  if (raw == null) return null;
  const formatted = formatSqlDate(raw);
  if (!formatted || !/^\d{4}-\d{2}-\d{2}$/.test(formatted)) return null;
  return formatted;
};

const markTermSentToClient = async (invoiceIdRaw, userId) => {
  const invoiceId = normalizeInvoiceId(invoiceIdRaw);
  if (invoiceId == null) {
    return { ok: false, reason: 'INVALID_ID' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [termRows] = await conn.execute(
      `SELECT invoice_id, account_id, status, term_name
         FROM invoice_terms
        WHERE invoice_id = ?
        FOR UPDATE`,
      [invoiceId]
    );
    const term = termRows[0];
    if (!term) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (term.status !== 'ISSUED') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_ISSUED' };
    }

    const sentBy = Number.isSafeInteger(Number(userId)) && Number(userId) > 0 ? Number(userId) : null;

    const [update] = await conn.execute(
      `UPDATE invoice_terms
          SET status = 'SENT',
              sent_to_client_at = NOW(),
              due_date = DATE_ADD(CURDATE(), INTERVAL 14 DAY),
              sent_by = ?,
              updated_at = CURRENT_TIMESTAMP
        WHERE invoice_id = ?
          AND status = 'ISSUED'`,
      [sentBy, invoiceId]
    );
    if (update.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_ISSUED' };
    }

    await insertInvoiceActivityLog(conn, {
      accountId: term.account_id,
      invoiceId,
      activityType: INVOICE_ACTIVITY_TYPES.INVOICE_SENT,
      title: 'Invoice dikirim ke client',
      description: `Invoice ${term.term_name} ditandai telah dikirim ke client.`,
      createdBy: sentBy
    });

    await syncInvoiceTermLifecycle(conn, term.account_id);
    await conn.commit();

    const detail = await findInvoiceAccountDetail(term.account_id);
    if (!detail.ok) {
      return { ok: false, reason: 'NOT_FOUND' };
    }
    return { ok: true, data: detail.data };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const sumVerifiedPaymentsForTerm = async (conn, invoiceId) => {
  const [rows] = await conn.execute(
    `SELECT COALESCE(SUM(amount_received_net), 0) AS total_paid
       FROM invoice_payments
      WHERE invoice_id = ?
        AND status = 'VERIFIED'`,
    [invoiceId]
  );
  return Number(rows[0]?.total_paid ?? 0);
};

const markTermPaidIfFullySettled = async (conn, invoiceId, netAmount) => {
  const totalPaid = await sumVerifiedPaymentsForTerm(conn, invoiceId);
  const net = Number(netAmount);
  if (!Number.isFinite(net) || net <= 0 || totalPaid + 0.0001 < net) {
    return false;
  }
  const [update] = await conn.execute(
    `UPDATE invoice_terms
        SET status = 'PAID',
            updated_at = CURRENT_TIMESTAMP
      WHERE invoice_id = ?
        AND status IN ('SENT', 'OVERDUE')`,
    [invoiceId]
  );
  return update.affectedRows === 1;
};

const syncHandoverDownPaymentPaid = async (conn, accountId, termType, termStatus, userId) => {
  if (termType !== 'DOWN_PAYMENT' || termStatus !== 'PAID') {
    return;
  }

  const [accRows] = await conn.execute(
    `SELECT engagement_id FROM invoice_accounts WHERE account_id = ? LIMIT 1`,
    [accountId]
  );
  const engagementId = accRows[0]?.engagement_id;
  if (engagementId == null) {
    return;
  }

  const [handoverRows] = await conn.execute(
    `SELECT handover_id FROM handovers WHERE engagement_id = ? LIMIT 1`,
    [engagementId]
  );
  const handoverId = handoverRows[0]?.handover_id;
  if (handoverId == null) {
    return;
  }

  await conn.execute(
    `UPDATE handovers
        SET dp_payment_status = 'PAID',
            dp_paid_at = COALESCE(dp_paid_at, NOW()),
            updated_at = CURRENT_TIMESTAMP
      WHERE handover_id = ?`,
    [handoverId]
  );

  await markDpReceivedChecklistPaid(conn, handoverId, userId);
};

const createInvoiceTermPayment = async (invoiceIdRaw, payload, fileMeta, userId) => {
  const invoiceId = normalizeInvoiceId(invoiceIdRaw);
  if (invoiceId == null) {
    return { ok: false, reason: 'INVALID_ID' };
  }

  const paymentMethod = normalizePaymentMethod(payload.payment_method);
  if (!paymentMethod) {
    return { ok: false, reason: 'INVALID_PAYMENT_METHOD' };
  }

  const transactionDate = normalizeTransactionDate(payload.transaction_date);
  if (!transactionDate) {
    return { ok: false, reason: 'INVALID_TRANSACTION_DATE' };
  }

  const amount = Number(payload.amount_received_net);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: 'INVALID_AMOUNT' };
  }

  const paymentChannel =
    payload.payment_channel != null && String(payload.payment_channel).trim() !== ''
      ? String(payload.payment_channel).trim().slice(0, 100)
      : null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [termRows] = await conn.execute(
      `SELECT invoice_id, account_id, status, net_amount, term_type, term_name
         FROM invoice_terms
        WHERE invoice_id = ?
        FOR UPDATE`,
      [invoiceId]
    );
    const term = termRows[0];
    if (!term) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (term.status !== 'SENT' && term.status !== 'OVERDUE') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_AWAITING_PAYMENT' };
    }

    let proofFileName = null;
    let proofFilePath = null;
    if (fileMeta?.filename) {
      proofFileName = fileMeta.originalname ? String(fileMeta.originalname).slice(0, 255) : fileMeta.filename;
      proofFilePath = `/uploads/invoices/${fileMeta.filename}`;
    }

    const verifiedBy =
      Number.isSafeInteger(Number(userId)) && Number(userId) > 0 ? Number(userId) : null;

    await conn.execute(
      `INSERT INTO invoice_payments (
          invoice_id,
          transaction_date,
          amount_received_net,
          tax_withheld_amount,
          payment_method,
          payment_channel,
          proof_file_name,
          proof_file_path,
          verified_by,
          verified_at,
          status
        ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, NOW(), 'VERIFIED')`,
      [
        invoiceId,
        transactionDate,
        amount,
        paymentMethod,
        paymentChannel,
        proofFileName,
        proofFilePath,
        verifiedBy
      ]
    );

    await insertInvoiceActivityLog(conn, {
      accountId: term.account_id,
      invoiceId,
      activityType: INVOICE_ACTIVITY_TYPES.INVOICE_PAYMENT_RECORDED,
      title: 'Pembayaran dicatat',
      description: `Pembayaran untuk ${term.term_name} berhasil dicatat sebesar ${formatAmountId(amount)}.`,
      createdBy: verifiedBy
    });

    await conn.execute(
      `UPDATE invoice_terms
          SET due_date = NULL,
              updated_at = CURRENT_TIMESTAMP
        WHERE invoice_id = ?`,
      [invoiceId]
    );

    const termMarkedPaid = await markTermPaidIfFullySettled(conn, invoiceId, term.net_amount);
    const termStatusAfter = termMarkedPaid ? 'PAID' : term.status;

    if (termMarkedPaid) {
      await insertInvoiceActivityLog(conn, {
        accountId: term.account_id,
        invoiceId,
        activityType: INVOICE_ACTIVITY_TYPES.INVOICE_TERM_PAID,
        title: 'Termin invoice lunas',
        description: `Termin ${term.term_name} telah lunas.`,
        createdBy: verifiedBy
      });
      await logAccountSettledIfNeeded(conn, term.account_id, verifiedBy);
    }

    await syncHandoverDownPaymentPaid(conn, term.account_id, term.term_type, termStatusAfter, verifiedBy);

    await syncInvoiceTermLifecycle(conn, term.account_id);
    await conn.commit();

    const detail = await findInvoiceAccountDetail(term.account_id);
    if (!detail.ok) {
      return { ok: false, reason: 'NOT_FOUND' };
    }
    return { ok: true, data: detail.data };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const allocateYearSequence = async (conn, issueDate) => {
  const year = issueDate.getFullYear();
  const [rows] = await conn.execute(
    `SELECT invoice_sequence_no
       FROM invoice_terms
      WHERE invoice_sequence_no IS NOT NULL
        AND issue_date IS NOT NULL
        AND YEAR(issue_date) = ?
      ORDER BY invoice_sequence_no DESC
      LIMIT 1
      FOR UPDATE`,
    [year]
  );
  const maxSeq = rows[0]?.invoice_sequence_no != null ? Number(rows[0].invoice_sequence_no) : 0;
  return maxSeq + 1;
};

const generateInvoiceTerm = async (invoiceIdRaw, userId) => {
  const invoiceId = normalizeInvoiceId(invoiceIdRaw);
  if (invoiceId == null) {
    return { ok: false, reason: 'INVALID_ID' };
  }

  const createdBy =
    Number.isSafeInteger(Number(userId)) && Number(userId) > 0 ? Number(userId) : null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [termRows] = await conn.execute(
      `SELECT
          it.invoice_id,
          it.account_id,
          it.status,
          it.invoice_number,
          it.term_name,
          ia.account_id AS account_exists
         FROM invoice_terms it
         INNER JOIN invoice_accounts ia ON ia.account_id = it.account_id
        WHERE it.invoice_id = ?
        FOR UPDATE`,
      [invoiceId]
    );
    const term = termRows[0];
    if (!term) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (term.status !== 'READY_TO_ISSUE') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_READY_TO_ISSUE' };
    }
    if (term.invoice_number) {
      await conn.rollback();
      return { ok: false, reason: 'ALREADY_GENERATED' };
    }

    const [ctxRows] = await conn.execute(
      `SELECT s.code AS service_code, s.name AS service_name
         FROM invoice_accounts ia
         INNER JOIN services s ON s.service_id = ia.service_id
        WHERE ia.account_id = ?
        LIMIT 1`,
      [term.account_id]
    );
    const ctx = ctxRows[0];
    const [dateRows] = await conn.execute('SELECT CURDATE() AS today');
    const issueDateSql = formatSqlDate(dateRows[0].today);
    const issueDateForNumber = sqlDateToLocalDate(issueDateSql);
    const sequenceNo = await allocateYearSequence(conn, issueDateForNumber);
    const invoiceNumber = buildInvoiceNumber({
      sequenceNo,
      serviceDbCode: ctx?.service_code,
      serviceName: ctx?.service_name,
      issueDate: issueDateForNumber
    });

    const [dup] = await conn.execute(
      `SELECT invoice_id FROM invoice_terms WHERE invoice_number = ? LIMIT 1`,
      [invoiceNumber]
    );
    if (dup[0]) {
      await conn.rollback();
      return { ok: false, reason: 'INVOICE_NUMBER_COLLISION' };
    }

    const [update] = await conn.execute(
      `UPDATE invoice_terms
          SET invoice_number = ?,
              invoice_sequence_no = ?,
              issue_date = CURDATE(),
              due_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY),
              status = 'ISSUED',
              updated_at = CURRENT_TIMESTAMP
        WHERE invoice_id = ?
          AND status = 'READY_TO_ISSUE'
          AND invoice_number IS NULL`,
      [invoiceNumber, sequenceNo, invoiceId]
    );
    if (update.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_READY_TO_ISSUE' };
    }

    await insertInvoiceActivityLog(conn, {
      accountId: term.account_id,
      invoiceId,
      activityType: INVOICE_ACTIVITY_TYPES.INVOICE_GENERATED,
      title: 'Invoice diterbitkan',
      description: `Invoice ${term.term_name} berhasil diterbitkan dengan nomor ${invoiceNumber}.`,
      createdBy
    });

    await syncInvoiceTermLifecycle(conn, term.account_id);
    await conn.commit();

    const detail = await findInvoiceAccountDetail(term.account_id);
    if (!detail.ok) {
      return { ok: false, reason: 'NOT_FOUND' };
    }

    return { ok: true, data: detail.data };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const confirmInvoiceTermTrigger = async (invoiceIdRaw, userId, triggerReferenceValueRaw) => {
  const invoiceId = normalizeInvoiceId(invoiceIdRaw);
  if (invoiceId == null) {
    return { ok: false, reason: 'INVALID_ID' };
  }

  const confirmedBy =
    Number.isSafeInteger(Number(userId)) && Number(userId) > 0 ? Number(userId) : null;
  if (confirmedBy == null) {
    return { ok: false, reason: 'UNAUTHORIZED' };
  }

  const triggerReference =
    triggerReferenceValueRaw != null && String(triggerReferenceValueRaw).trim() !== ''
      ? String(triggerReferenceValueRaw).trim().slice(0, 100)
      : DEFAULT_PROJECT_COMPLETION_REFERENCE;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [termRows] = await conn.execute(
      `SELECT invoice_id, account_id, term_type, term_name, billing_trigger_type, status
         FROM invoice_terms
        WHERE invoice_id = ?
        FOR UPDATE`,
      [invoiceId]
    );
    const term = termRows[0];
    if (!term) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const isFinalTrigger =
      term.term_type === 'FINAL' || term.billing_trigger_type === 'PROJECT_COMPLETION';
    if (!isFinalTrigger) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_TRIGGER_TERM' };
    }

    if (term.status !== 'DRAFT') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_DRAFT' };
    }

    const [update] = await conn.execute(
      `UPDATE invoice_terms
          SET trigger_reference_value = ?,
              trigger_confirmed_by = ?,
              trigger_confirmed_at = NOW(),
              updated_at = CURRENT_TIMESTAMP
        WHERE invoice_id = ?
          AND status = 'DRAFT'`,
      [triggerReference, confirmedBy, invoiceId]
    );
    if (update.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_DRAFT' };
    }

    await insertInvoiceActivityLog(conn, {
      accountId: term.account_id,
      invoiceId,
      activityType: INVOICE_ACTIVITY_TYPES.INVOICE_TRIGGER_CONFIRMED,
      title: 'Trigger invoice dikonfirmasi',
      description: `Trigger untuk ${term.term_name} telah dikonfirmasi: ${triggerReference}.`,
      createdBy: confirmedBy
    });

    await syncInvoiceTermLifecycle(conn, term.account_id);
    await conn.commit();

    const detail = await findInvoiceAccountDetail(term.account_id);
    if (!detail.ok) {
      return { ok: false, reason: 'NOT_FOUND' };
    }
    return { ok: true, data: detail.data };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

module.exports = {
  generateInvoiceTerm,
  markTermSentToClient,
  createInvoiceTermPayment,
  confirmInvoiceTermTrigger
};
