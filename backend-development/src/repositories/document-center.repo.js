const { pool } = require('../config/db');
const { formatLeadSourceLabel } = require('../utils/lead-source-label');

const TRACKED_LEAD_WHERE = `
  l.lead_status IN ('ACTIVE', 'WON', 'LOST')
  AND (
    (l.source_type = 'FORM_LEAD_CAPTURE' AND l.bank_data_status = 'PROCESSED')
    OR l.source_type = 'MANUAL'
  )
`;

const UI_CATEGORIES = ['PROPOSAL', 'ENGAGEMENT_LETTER', 'CLIENT_PROVIDED', 'INVOICE_PAYMENT', 'PROJECT'];

const DB_CATEGORY_TO_UI = {
  PROPOSAL: 'PROPOSAL',
  ENGAGEMENT_LETTER: 'ENGAGEMENT_LETTER',
  HANDOVER: 'CLIENT_PROVIDED',
  PROJECT: 'PROJECT',
  OTHER: 'OTHER'
};

const formatDateTimeIso = (value) => {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const toNumber = (value) => {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const scopeClause = (processedByUserId) => {
  if (processedByUserId != null) {
    return { sql: ' AND l.processed_by = ? ', params: [processedByUserId] };
  }
  return { sql: '', params: [] };
};

const buildLeadDocAggregatesCte = () => `
  lead_doc_counts AS (
    SELECT
        l.lead_id,
        COUNT(DISTINCT d.document_id) AS doc_table_count,
        COUNT(DISTINCT CASE WHEN ip.proof_file_path IS NOT NULL AND TRIM(ip.proof_file_path) <> '' THEN ip.payment_id END) AS invoice_proof_count,
        MAX(d.created_at) AS max_doc_at,
        MAX(ip.created_at) AS max_payment_at,
        SUM(CASE WHEN d.document_category = 'PROPOSAL' THEN 1 ELSE 0 END) AS cnt_proposal,
        SUM(CASE WHEN d.document_category = 'ENGAGEMENT_LETTER' THEN 1 ELSE 0 END) AS cnt_engagement,
        SUM(CASE WHEN d.document_category = 'HANDOVER' THEN 1 ELSE 0 END) AS cnt_handover,
        SUM(CASE WHEN d.document_category = 'PROJECT' THEN 1 ELSE 0 END) AS cnt_project
      FROM leads l
      LEFT JOIN documents d ON d.lead_id = l.lead_id
      LEFT JOIN invoice_accounts ia ON ia.lead_id = l.lead_id
      LEFT JOIN invoice_terms it ON it.account_id = ia.account_id
      LEFT JOIN invoice_payments ip ON ip.invoice_id = it.invoice_id
     WHERE ${TRACKED_LEAD_WHERE}
     GROUP BY l.lead_id
  )
`;

const mapListLeadRow = (row) => {
  const docTable = Number(row.doc_table_count) || 0;
  const invoiceProof = Number(row.invoice_proof_count) || 0;
  const totalDocuments = docTable + invoiceProof;
  const lastDoc = row.max_doc_at ? new Date(row.max_doc_at).getTime() : 0;
  const lastPay = row.max_payment_at ? new Date(row.max_payment_at).getTime() : 0;
  const lastMs = Math.max(lastDoc, lastPay);
  return {
    lead_id: row.lead_id,
    lead_code: row.lead_code ?? null,
    company_name: row.company_name,
    current_stage: row.current_stage,
    processed_by: row.processed_by ?? null,
    processed_by_name: row.processed_by_name ?? null,
    service_name: row.service_name ?? null,
    total_documents: totalDocuments,
    last_updated_at: lastMs > 0 ? formatDateTimeIso(new Date(lastMs)) : null,
    category_counts: {
      PROPOSAL: Number(row.cnt_proposal) || 0,
      ENGAGEMENT_LETTER: Number(row.cnt_engagement) || 0,
      CLIENT_PROVIDED: Number(row.cnt_handover) || 0,
      INVOICE_PAYMENT: invoiceProof,
      PROJECT: Number(row.cnt_project) || 0
    },
  };
};

const listLeads = async (processedByUserId) => {
  const scope = scopeClause(processedByUserId);
  const [rows] = await pool.execute(
    `WITH ${buildLeadDocAggregatesCte()}
     SELECT
         l.lead_id,
         l.lead_code,
         l.company_name,
         l.current_stage,
         l.processed_by,
         up.name AS processed_by_name,
         (
           SELECT s.name
             FROM proposals p
             INNER JOIN services s ON s.service_id = p.service_id
            WHERE p.lead_id = l.lead_id
            ORDER BY p.updated_at DESC, p.proposal_id DESC
            LIMIT 1
         ) AS service_name,
         ldc.doc_table_count,
         ldc.invoice_proof_count,
         ldc.max_doc_at,
         ldc.max_payment_at,
         ldc.cnt_proposal,
         ldc.cnt_engagement,
         ldc.cnt_handover,
         ldc.cnt_project
       FROM leads l
       INNER JOIN lead_doc_counts ldc ON ldc.lead_id = l.lead_id
       LEFT JOIN users up ON up.id = l.processed_by
      WHERE ${TRACKED_LEAD_WHERE}
        ${scope.sql}
        AND (ldc.doc_table_count > 0 OR ldc.invoice_proof_count > 0)
      ORDER BY
        COALESCE(GREATEST(ldc.max_doc_at, ldc.max_payment_at), l.processed_at, l.created_at) DESC,
        l.lead_id DESC`,
    scope.params
  );
  return rows.map(mapListLeadRow);
};

const computeListSummary = (items) => {
  const categoryTotals = {
    proposal: 0,
    engagement_letter: 0,
    client_documents: 0,
    invoice_proof: 0,
    project: 0
  };

  for (const item of items) {
    const counts = item.category_counts ?? {};
    categoryTotals.proposal += Number(counts.PROPOSAL) || 0;
    categoryTotals.engagement_letter += Number(counts.ENGAGEMENT_LETTER) || 0;
    categoryTotals.client_documents += Number(counts.CLIENT_PROVIDED) || 0;
    categoryTotals.invoice_proof += Number(counts.INVOICE_PAYMENT) || 0;
    categoryTotals.project += Number(counts.PROJECT) || 0;
  }

  const totalDocuments = items.reduce((sum, i) => sum + i.total_documents, 0);

  return {
    total_documents: totalDocuments,
    ...categoryTotals
  };
};

const resolveLeadSourceLabel = (row) => {
  if (row.source_type === 'MANUAL') {
    return 'Manual';
  }
  return formatLeadSourceLabel(row.link_type, row.channel_code, row.channel_name);
};

const mapLeadHeaderRow = (row) => ({
  lead_id: row.lead_id,
  lead_code: row.lead_code ?? null,
  company_name: row.company_name,
  company_address: row.company_address ?? '',
  pic_name: row.pic_name,
  email: row.email,
  phone_number: row.phone_number,
  desired_services: row.desired_services ?? null,
  service_name: row.service_name ?? null,
  lead_source_label: resolveLeadSourceLabel(row),
  processed_by: row.processed_by ?? null,
  processed_by_name: row.processed_by_name ?? null,
  processed_at: row.processed_at ?? null,
  updated_at: row.updated_at ?? null,
  current_stage: row.current_stage
});

const findLeadHeader = async (leadId, processedByUserId) => {
  const scope = scopeClause(processedByUserId);
  const [rows] = await pool.execute(
    `SELECT
         l.lead_id,
         l.lead_code,
         l.company_name,
         l.company_address,
         l.pic_name,
         l.email,
         l.phone_number,
         l.desired_services,
         l.source_type,
         l.current_stage,
         l.processed_at,
         l.processed_by,
         l.updated_at,
         up.name AS processed_by_name,
         fdl.link_type,
         ch.code AS channel_code,
         ch.name AS channel_name,
         (
           SELECT s.name
             FROM proposals p
             INNER JOIN services s ON s.service_id = p.service_id
            WHERE p.lead_id = l.lead_id
            ORDER BY p.updated_at DESC, p.proposal_id DESC
            LIMIT 1
         ) AS service_name
       FROM leads l
       LEFT JOIN users up ON up.id = l.processed_by
       LEFT JOIN form_distribution_links fdl ON fdl.distribution_link_id = l.distribution_link_id
       LEFT JOIN form_channels ch ON ch.channel_id = fdl.channel_id
      WHERE l.lead_id = ?
        AND ${TRACKED_LEAD_WHERE}
        ${scope.sql}
      LIMIT 1`,
    [leadId, ...scope.params]
  );
  return rows[0] ? mapLeadHeaderRow(rows[0]) : null;
};

const mapDocumentRow = (row) => {
  const uiCategory = DB_CATEGORY_TO_UI[row.document_category] ?? row.document_category;
  const tags = [];
  if (row.is_latest === 1) tags.push('LATEST');
  if (uiCategory === 'CLIENT_PROVIDED') tags.push('CLIENT_PROVIDED');
  if (uiCategory === 'PROPOSAL' && row.proposal_status === 'APPROVED') tags.push('FINAL');
  if (uiCategory === 'PROPOSAL' && row.proposal_status === 'SENT') tags.push('SIGNED');
  if (row.engagement_status === 'SIGNED' && uiCategory === 'ENGAGEMENT_LETTER') tags.push('SIGNED');

  const ext = (row.file_name || '').split('.').pop()?.toLowerCase() ?? '';

  return {
    source: 'DOCUMENT',
    id: String(row.document_id),
    document_id: row.document_id,
    lead_id: row.lead_id,
    category: uiCategory,
    document_name: row.document_name,
    file_name: row.file_name,
    file_path: row.file_path,
    mime_type: row.mime_type ?? null,
    file_size_bytes: toNumber(row.file_size_bytes),
    file_extension: ext || null,
    version_no: row.version_no ?? 1,
    is_latest: row.is_latest === 1,
    uploaded_by: row.uploaded_by ?? null,
    uploaded_by_name: row.uploaded_by_name ?? null,
    uploaded_at: formatDateTimeIso(row.created_at),
    source_module:
      uiCategory === 'PROPOSAL'
        ? 'Lead Workspace'
        : uiCategory === 'ENGAGEMENT_LETTER'
          ? 'Lead Workspace'
          : uiCategory === 'CLIENT_PROVIDED'
            ? 'Handover'
            : uiCategory === 'PROJECT'
              ? 'Project'
              : 'Document',
    tags
  };
};

const mapInvoicePaymentRow = (row) => ({
  source: 'INVOICE_PAYMENT',
  id: `pay-${row.payment_id}`,
  payment_id: row.payment_id,
  lead_id: row.lead_id,
  category: 'INVOICE_PAYMENT',
  document_name: row.proof_file_name || `Bukti pembayaran #${row.payment_id}`,
  file_name: row.proof_file_name ?? null,
  file_path: row.proof_file_path,
  mime_type: null,
  file_size_bytes: null,
  file_extension: (row.proof_file_name || '').split('.').pop()?.toLowerCase() || null,
  version_no: 1,
  is_latest: true,
  uploaded_by: null,
  uploaded_by_name: row.verified_by_name ?? null,
  uploaded_at: formatDateTimeIso(row.created_at),
  source_module: 'Invoice',
  tags: ['PAYMENT_PROOF'],
  invoice_id: row.invoice_id,
  term_name: row.term_name ?? null
});

const listLeadDocuments = async (leadId, processedByUserId, { latestOnly = false } = {}) => {
  const scope = scopeClause(processedByUserId);
  const latestDocSql = latestOnly ? ' AND d.is_latest = 1 ' : '';

  const [docRows] = await pool.execute(
    `SELECT
         d.document_id,
         d.lead_id,
         d.document_category,
         d.document_name,
         d.file_name,
         d.file_path,
         d.mime_type,
         d.file_size_bytes,
         d.version_no,
         d.is_latest,
         d.uploaded_by,
         d.created_at,
         u.name AS uploaded_by_name,
         p.proposal_status AS proposal_status,
         el.engagement_status AS engagement_status
       FROM documents d
       LEFT JOIN users u ON u.id = d.uploaded_by
       LEFT JOIN proposals p ON p.proposal_id = d.proposal_id
       LEFT JOIN engagement_letters el ON el.engagement_id = d.engagement_id
      WHERE d.lead_id = ?
        ${latestDocSql}
        AND EXISTS (
          SELECT 1 FROM leads l
           WHERE l.lead_id = d.lead_id
             AND ${TRACKED_LEAD_WHERE}
             ${scope.sql}
        )
      ORDER BY d.created_at DESC, d.document_id DESC`,
    [leadId, ...scope.params]
  );

  const [paymentRows] = await pool.execute(
    `SELECT
         ip.payment_id,
         ia.lead_id,
         ip.invoice_id,
         ip.proof_file_name,
         ip.proof_file_path,
         ip.created_at,
         it.term_name,
         u.name AS verified_by_name
       FROM invoice_payments ip
       INNER JOIN invoice_terms it ON it.invoice_id = ip.invoice_id
       INNER JOIN invoice_accounts ia ON ia.account_id = it.account_id
       LEFT JOIN users u ON u.id = ip.verified_by
      WHERE ia.lead_id = ?
        AND ip.proof_file_path IS NOT NULL
        AND TRIM(ip.proof_file_path) <> ''
        AND EXISTS (
          SELECT 1 FROM leads l
           WHERE l.lead_id = ia.lead_id
             AND ${TRACKED_LEAD_WHERE}
             ${scope.sql}
        )
      ORDER BY ip.created_at DESC, ip.payment_id DESC`,
    [leadId, ...scope.params]
  );

  const documents = docRows.map(mapDocumentRow);
  const payments = paymentRows.map(mapInvoicePaymentRow);
  return [...documents, ...payments];
};

const findDocumentForDownload = async (documentId, processedByUserId) => {
  const scope = scopeClause(processedByUserId);
  const [rows] = await pool.execute(
    `SELECT d.document_id, d.file_path, d.file_name, d.mime_type, d.lead_id
       FROM documents d
      WHERE d.document_id = ?
        AND EXISTS (
          SELECT 1 FROM leads l
           WHERE l.lead_id = d.lead_id
             AND ${TRACKED_LEAD_WHERE}
             ${scope.sql}
        )
      LIMIT 1`,
    [documentId, ...scope.params]
  );
  return rows[0] ?? null;
};

const findInvoicePaymentForDownload = async (paymentId, processedByUserId) => {
  const scope = scopeClause(processedByUserId);
  const [rows] = await pool.execute(
    `SELECT ip.payment_id, ip.proof_file_path, ip.proof_file_name, ia.lead_id
       FROM invoice_payments ip
       INNER JOIN invoice_terms it ON it.invoice_id = ip.invoice_id
       INNER JOIN invoice_accounts ia ON ia.account_id = it.account_id
      WHERE ip.payment_id = ?
        AND ip.proof_file_path IS NOT NULL
        AND TRIM(ip.proof_file_path) <> ''
        AND EXISTS (
          SELECT 1 FROM leads l
           WHERE l.lead_id = ia.lead_id
             AND ${TRACKED_LEAD_WHERE}
             ${scope.sql}
        )
      LIMIT 1`,
    [paymentId, ...scope.params]
  );
  return rows[0] ?? null;
};

const groupByCategory = (items) => {
  const grouped = {};
  for (const key of UI_CATEGORIES) {
    grouped[key] = [];
  }
  for (const item of items) {
    const cat = item.category;
    if (grouped[cat]) grouped[cat].push(item);
    else if (!grouped.OTHER) grouped.OTHER = [];
    if (!UI_CATEGORIES.includes(cat) && grouped.OTHER) grouped.OTHER.push(item);
  }
  return grouped;
};

const categorySummaryFromItems = (items) => {
  const grouped = groupByCategory(items);
  const summary = {};
  for (const key of UI_CATEGORIES) {
    summary[key] = grouped[key]?.length ?? 0;
  }
  return { grouped, summary, total: items.length };
};

module.exports = {
  UI_CATEGORIES,
  TRACKED_LEAD_WHERE,
  listLeads,
  computeListSummary,
  findLeadHeader,
  listLeadDocuments,
  groupByCategory,
  categorySummaryFromItems,
  findDocumentForDownload,
  findInvoicePaymentForDownload
};
