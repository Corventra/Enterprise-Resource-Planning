const { pool } = require('../config/db');
const { buildInvoiceNextAction } = require('../utils/invoice-next-action');
const { syncInvoiceTermLifecycleForRead } = require('../utils/invoice-term-lifecycle');
const { formatSqlDate } = require('../utils/sql-date');

const normalizeAccountId = (accountId) => {
  const n = Number(accountId);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
};

const formatDateTimeIso = (v) => {
  if (v == null) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString();
  }
  const s = String(v);
  return s.includes('T') ? s : `${s.replace(' ', 'T')}Z`;
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const computePaymentProgress = (totalBillNet, totalPaidNet) => {
  const bill = toNumber(totalBillNet);
  const paid = toNumber(totalPaidNet);
  if (bill <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((paid / bill) * 100)));
};

const mapListRow = (row, nextAction) => ({
  account_id: row.account_id,
  lead_id: row.lead_id,
  company_name: row.company_name ?? null,
  service_name: row.service_name ?? null,
  contract_value_dpp: toNumber(row.contract_value_dpp),
  total_bill_net: toNumber(row.total_bill_net),
  next_due_date: formatSqlDate(row.next_due_date),
  status: row.status,
  progress_summary: row.progress_summary ?? null,
  payment_progress: computePaymentProgress(row.total_bill_net, row.total_paid_net),
  next_action: nextAction
});

const findInvoiceTermsByAccountIds = async (accountIds) => {
  if (!accountIds.length) return new Map();
  const placeholders = accountIds.map(() => '?').join(', ');
  const [rows] = await pool.execute(
    `SELECT
        account_id,
        invoice_id,
        term_name,
        term_order,
        status,
        due_date
      FROM invoice_terms
     WHERE account_id IN (${placeholders})
     ORDER BY account_id ASC, term_order ASC, invoice_id ASC`,
    accountIds
  );

  const grouped = new Map();
  for (const row of rows) {
    const key = row.account_id;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  return grouped;
};

const findInvoiceAccounts = async () => {
  await syncInvoiceTermLifecycleForRead(null);

  const [rows] = await pool.execute(
    `SELECT
        ia.account_id,
        ia.lead_id,
        ia.contract_value_dpp,
        ia.total_bill_net,
        ia.total_paid_net,
        ia.next_due_date,
        ia.status,
        ia.progress_summary,
        ia.created_at,
        l.company_name,
        s.name AS service_name
      FROM invoice_accounts ia
      INNER JOIN leads l ON l.lead_id = ia.lead_id
      INNER JOIN services s ON s.service_id = ia.service_id
     ORDER BY ia.created_at DESC, ia.account_id DESC`
  );

  const accountIds = rows.map((r) => r.account_id);
  const termsByAccount = await findInvoiceTermsByAccountIds(accountIds);

  return rows.map((row) => {
    const terms = termsByAccount.get(row.account_id) ?? [];
    const nextAction = buildInvoiceNextAction(terms);
    return mapListRow(row, nextAction);
  });
};

const findInvoiceTerms = async (accountId) => {
  const [rows] = await pool.execute(
    `SELECT
        it.invoice_id,
        it.account_id,
        it.invoice_number,
        it.term_name,
        it.term_type,
        it.term_order,
        it.percentage,
        it.dpp_amount,
        it.ppn_rate,
        it.ppn_amount,
        it.pph23_rate,
        it.pph23_amount,
        it.gross_amount,
        it.net_amount,
        it.issue_date,
        it.due_date,
        it.billing_schedule_date,
        it.billing_trigger_type,
        it.trigger_reference_value,
        it.trigger_confirmed_at,
        it.sent_to_client_at,
        it.status,
        ia.issuer_company
      FROM invoice_terms it
      INNER JOIN invoice_accounts ia ON ia.account_id = it.account_id
     WHERE it.account_id = ?
     ORDER BY it.term_order ASC, it.invoice_id ASC`,
    [accountId]
  );

  return rows.map((row) => ({
    invoice_id: row.invoice_id,
    invoice_number: row.invoice_number ?? null,
    term_name: row.term_name,
    term_type: row.term_type,
    term_order: row.term_order,
    percentage: toNumber(row.percentage),
    dpp_amount: toNumber(row.dpp_amount),
    ppn_rate: toNumber(row.ppn_rate),
    ppn_amount: toNumber(row.ppn_amount),
    pph23_rate: toNumber(row.pph23_rate),
    pph23_amount: toNumber(row.pph23_amount),
    gross_amount: toNumber(row.gross_amount),
    net_amount: toNumber(row.net_amount),
    issue_date: formatSqlDate(row.issue_date),
    due_date: formatSqlDate(row.due_date),
    billing_schedule_date: formatSqlDate(row.billing_schedule_date),
    billing_trigger_type: row.billing_trigger_type,
    trigger_reference_value: row.trigger_reference_value ?? null,
    trigger_confirmed_at: formatDateTimeIso(row.trigger_confirmed_at),
    sent_to_client_at: formatDateTimeIso(row.sent_to_client_at),
    status: row.status,
    issuer_company: row.issuer_company
  }));
};

const findInvoicePayments = async (accountId) => {
  const [rows] = await pool.execute(
    `SELECT
        ip.payment_id,
        ip.invoice_id,
        ip.transaction_date,
        ip.amount_received_net,
        ip.payment_method,
        ip.status,
        ip.verified_at,
        ip.proof_file_name,
        ip.proof_file_path,
        ip.created_at,
        it.term_name,
        u.name AS verified_by_name
      FROM invoice_payments ip
      INNER JOIN invoice_terms it ON it.invoice_id = ip.invoice_id
      LEFT JOIN users u ON u.id = ip.verified_by
     WHERE it.account_id = ?
     ORDER BY ip.transaction_date DESC, ip.payment_id DESC`,
    [accountId]
  );

  return rows.map((row) => ({
    payment_id: row.payment_id,
    invoice_id: row.invoice_id,
    transaction_date: formatSqlDate(row.transaction_date),
    amount_received_net: toNumber(row.amount_received_net),
    payment_method: row.payment_method,
    verified_by_name: row.verified_by_name ?? null,
    verified_at: formatDateTimeIso(row.verified_at),
    status: row.status,
    term_name: row.term_name,
    proof_file_name: row.proof_file_name ?? null,
    proof_file_path: row.proof_file_path ?? null,
    created_at: formatDateTimeIso(row.created_at)
  }));
};

const fetchLatestProposalDocument = async (proposalId) => {
  if (proposalId == null) return null;
  const [rows] = await pool.execute(
    `SELECT
        d.document_id,
        d.document_name,
        d.file_path,
        d.mime_type,
        d.file_size_bytes,
        d.version_no,
        d.created_at
      FROM documents d
     WHERE d.proposal_id = ?
       AND d.document_category = 'PROPOSAL'
       AND d.is_latest = 1
     LIMIT 1`,
    [proposalId]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    document_id: row.document_id,
    document_name: row.document_name,
    file_path: row.file_path,
    mime_type: row.mime_type ?? null,
    file_size_bytes: row.file_size_bytes ?? null,
    version_no: row.version_no ?? null,
    uploaded_at: formatDateTimeIso(row.created_at)
  };
};

const fetchLatestEngagementDocument = async (engagementId) => {
  const [rows] = await pool.execute(
    `SELECT
        d.document_id,
        d.document_name,
        d.file_path,
        d.mime_type,
        d.file_size_bytes,
        d.version_no,
        d.created_at
      FROM documents d
     WHERE d.engagement_id = ?
       AND d.document_category = 'ENGAGEMENT_LETTER'
       AND d.is_latest = 1
     LIMIT 1`,
    [engagementId]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    document_id: row.document_id,
    document_name: row.document_name,
    file_path: row.file_path,
    mime_type: row.mime_type ?? null,
    file_size_bytes: row.file_size_bytes ?? null,
    version_no: row.version_no ?? null,
    uploaded_at: formatDateTimeIso(row.created_at)
  };
};

const findInvoiceActivityLogs = async (accountId) => {
  const [rows] = await pool.execute(
    `SELECT
        l.invoice_activity_id,
        l.account_id,
        l.invoice_id,
        l.activity_type,
        l.title,
        l.description,
        l.created_at,
        u.name AS created_by_name
      FROM invoice_activity_logs l
      LEFT JOIN users u ON u.id = l.created_by
     WHERE l.account_id = ?
     ORDER BY l.created_at DESC, l.invoice_activity_id DESC`,
    [accountId]
  );

  return rows.map((row) => ({
    invoice_activity_id: row.invoice_activity_id,
    account_id: row.account_id,
    invoice_id: row.invoice_id ?? null,
    activity_type: row.activity_type,
    title: row.title,
    description: row.description ?? null,
    created_by_name: row.created_by_name ?? null,
    created_at: formatDateTimeIso(row.created_at)
  }));
};

const findInvoiceRelatedDocuments = async (proposalId, engagementId) => {
  const [latest_proposal_document, latest_engagement_document] = await Promise.all([
    fetchLatestProposalDocument(proposalId),
    fetchLatestEngagementDocument(engagementId)
  ]);
  return { latest_proposal_document, latest_engagement_document };
};

const findInvoiceAccountCore = async (accountId) => {
  const [rows] = await pool.execute(
    `SELECT
        ia.account_id,
        ia.lead_id,
        ia.proposal_id,
        ia.engagement_id,
        ia.contract_value_dpp,
        ia.payment_method,
        ia.issuer_company,
        ia.total_bill_net,
        ia.total_paid_net,
        ia.total_outstanding_net,
        ia.next_due_date,
        ia.status,
        ia.progress_summary,
        l.company_name,
        l.company_address,
        l.pic_name,
        l.phone_number AS pic_phone,
        l.email AS pic_email,
        s.name AS service_name,
        e.signed_at AS engagement_signed_at
      FROM invoice_accounts ia
      INNER JOIN leads l ON l.lead_id = ia.lead_id
      INNER JOIN services s ON s.service_id = ia.service_id
      INNER JOIN engagement_letters e ON e.engagement_id = ia.engagement_id
     WHERE ia.account_id = ?
     LIMIT 1`,
    [accountId]
  );
  return rows[0] ?? null;
};

const findInvoiceAccountDetail = async (accountIdRaw) => {
  const accountId = normalizeAccountId(accountIdRaw);
  if (accountId == null) {
    return { ok: false, reason: 'INVALID_ID' };
  }

  await syncInvoiceTermLifecycleForRead(accountId);

  const core = await findInvoiceAccountCore(accountId);
  if (!core) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  const [terms, payments, related_documents, activity_logs] = await Promise.all([
    findInvoiceTerms(accountId),
    findInvoicePayments(accountId),
    findInvoiceRelatedDocuments(core.proposal_id, core.engagement_id),
    findInvoiceActivityLogs(accountId)
  ]);

  const next_action = buildInvoiceNextAction(terms);

  const core_detail = {
    account_id: core.account_id,
    lead_id: core.lead_id,
    company_name: core.company_name ?? null,
    company_address: core.company_address ?? null,
    pic_name: core.pic_name ?? null,
    pic_phone: core.pic_phone ?? null,
    pic_email: core.pic_email ?? null,
    contract_value_dpp: toNumber(core.contract_value_dpp),
    payment_method: core.payment_method,
    engagement_reference: core.engagement_id != null ? `EL #${core.engagement_id}` : null,
    engagement_signed_at: formatDateTimeIso(core.engagement_signed_at),
    service_name: core.service_name ?? null,
    issuer_company: core.issuer_company
  };

  const summary = {
    total_bill_net: toNumber(core.total_bill_net),
    total_paid_net: toNumber(core.total_paid_net),
    total_outstanding_net: toNumber(core.total_outstanding_net),
    status: core.status,
    progress_summary: core.progress_summary ?? null,
    payment_progress: computePaymentProgress(core.total_bill_net, core.total_paid_net),
    next_due_date: formatSqlDate(core.next_due_date),
    next_action
  };

  return {
    ok: true,
    data: {
      core_detail,
      summary,
      terms,
      payments,
      related_documents,
      activity_logs
    }
  };
};

module.exports = {
  findInvoiceAccounts,
  findInvoiceAccountDetail,
  findInvoiceTerms,
  findInvoicePayments,
  findInvoiceRelatedDocuments,
  findInvoiceActivityLogs
};
