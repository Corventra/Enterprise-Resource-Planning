const { pool } = require('../config/db');
const { formatLeadSourceLabel } = require('../utils/lead-source-label');
const { formatSqlDate } = require('../utils/sql-date');
const leadWorkspaceRepo = require('./lead-workspace.repo');

const normalizeLeadId = (leadId) => {
  const n = Number(leadId);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
};

const normalizeEngagementId = (engagementId) => {
  const n = Number(engagementId);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
};

const mapLeadSummaryRow = (row) => ({
  company_name: row.company_name ?? null,
  pic_name: row.pic_name ?? null,
  email: row.email ?? null,
  phone_number: row.phone_number ?? null,
  desired_services: row.desired_services ?? null,
  lead_source_label:
    row.source_type === 'MANUAL'
      ? 'Manual'
      : formatLeadSourceLabel(row.link_type, row.channel_code, row.channel_name),
  processed_by_name: row.processed_by_name ?? null,
  processed_at: row.processed_at ?? null
});

const fetchLeadSummaryByLeadId = async (conn, leadId) => {
  const [rows] = await conn.execute(
    `SELECT
        l.company_name,
        l.pic_name,
        l.email,
        l.phone_number,
        l.desired_services,
        l.processed_at,
        l.source_type,
        upb.name AS processed_by_name,
        fdl.link_type,
        ch.code AS channel_code,
        ch.name AS channel_name
      FROM leads l
      LEFT JOIN users upb ON upb.id = l.processed_by
      LEFT JOIN form_distribution_links fdl ON fdl.distribution_link_id = l.distribution_link_id
      LEFT JOIN form_channels ch ON ch.channel_id = fdl.channel_id
     WHERE l.lead_id = ?`,
    [leadId]
  );
  return rows[0] ? mapLeadSummaryRow(rows[0]) : null;
};

const mapDocumentRow = (row) => {
  if (!row || row.document_id == null) return null;
  return {
    document_id: row.document_id,
    document_name: row.document_name,
    version_no: row.version_no,
    file_name: row.file_name,
    file_path: row.file_path,
    mime_type: row.mime_type ?? null,
    file_size_bytes: row.file_size_bytes != null ? Number(row.file_size_bytes) : null,
    uploaded_by: row.uploaded_by ?? null,
    created_at: row.created_at
  };
};

const fetchLatestProposalDocument = async (conn, proposalId) => {
  const [rows] = await conn.execute(
    `SELECT
        d.document_id,
        d.document_name,
        d.version_no,
        d.file_name,
        d.file_path,
        d.mime_type,
        d.file_size_bytes,
        d.uploaded_by,
        d.created_at
      FROM documents d
     WHERE d.proposal_id = ?
       AND d.document_category = 'PROPOSAL'
       AND d.is_latest = 1
     LIMIT 1`,
    [proposalId]
  );
  return mapDocumentRow(rows[0]);
};

const fetchLatestEngagementDocument = async (conn, engagementId) => {
  const [rows] = await conn.execute(
    `SELECT
        d.document_id,
        d.document_name,
        d.version_no,
        d.file_name,
        d.file_path,
        d.mime_type,
        d.file_size_bytes,
        d.uploaded_by,
        d.created_at
      FROM documents d
     WHERE d.engagement_id = ?
       AND d.document_category = 'ENGAGEMENT_LETTER'
       AND d.is_latest = 1
     LIMIT 1`,
    [engagementId]
  );
  return mapDocumentRow(rows[0]);
};

const fetchTermins = async (conn, engagementId) => {
  const [rows] = await conn.execute(
    `SELECT
        termin_id,
        engagement_id,
        term_name,
        term_type,
        percentage,
        description,
        billing_schedule_date,
        sort_order
      FROM engagement_letter_termins
     WHERE engagement_id = ?
     ORDER BY sort_order ASC, termin_id ASC`,
    [engagementId]
  );
  return rows.map((r) => ({
    termin_id: r.termin_id,
    engagement_id: r.engagement_id,
    term_name: r.term_name,
    term_type: r.term_type,
    percentage: r.percentage != null ? Number(r.percentage) : null,
    description: r.description ?? null,
    billing_schedule_date: formatSqlDate(r.billing_schedule_date),
    sort_order: r.sort_order
  }));
};

const fetchRetainer = async (conn, engagementId) => {
  const [rows] = await conn.execute(
    `SELECT
        retainer_id,
        engagement_id,
        contract_start_date,
        contract_end_date,
        billing_timing
      FROM engagement_letter_retainers
     WHERE engagement_id = ?
     LIMIT 1`,
    [engagementId]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    retainer_id: r.retainer_id,
    engagement_id: r.engagement_id,
    contract_start_date: formatSqlDate(r.contract_start_date),
    contract_end_date: formatSqlDate(r.contract_end_date),
    billing_timing: r.billing_timing
  };
};

const engagementBaseSelect = `
  SELECT
      e.engagement_id,
      e.engagement_code,
      e.lead_id,
      e.proposal_id,
      e.issuer_company,
      e.agreed_fee,
      e.payment_method,
      e.engagement_status,
      e.revision_note,
      e.approved_by,
      e.approved_at,
      e.sent_to_client_at,
      e.signed_at,
      e.submitted_by,
      e.submitted_at,
      e.created_by,
      e.created_at,
      e.updated_at,
      ucb.name AS created_by_name,
      usb.name AS submitted_by_name,
      uab.name AS approved_by_name,
      p.proposal_code,
      p.proposal_fee,
      p.discount_amount,
      p.proposal_status,
      p.issuer_company AS proposal_issuer_company,
      s.name AS service_name,
      sc.name AS service_class_name
    FROM engagement_letters e
    INNER JOIN proposals p ON p.proposal_id = e.proposal_id
    INNER JOIN services s ON s.service_id = p.service_id
    INNER JOIN service_classes sc ON sc.service_class_id = s.service_class_id
    LEFT JOIN users ucb ON ucb.id = e.created_by
    LEFT JOIN users usb ON usb.id = e.submitted_by
    LEFT JOIN users uab ON uab.id = e.approved_by
`;

const buildProposalSummaryPayload = async (conn, baseRow) => {
  const latest_prop_doc = await fetchLatestProposalDocument(conn, baseRow.proposal_id);
  const proposalFee = Number(baseRow.proposal_fee);
  const discountAmount = Number(baseRow.discount_amount);

  return {
    proposal_id: baseRow.proposal_id,
    proposal_code: baseRow.proposal_code ?? null,
    service_class_name: baseRow.service_class_name ?? null,
    service_name: baseRow.service_name ?? null,
    proposal_fee: proposalFee,
    discount_amount: discountAmount,
    final_proposal_value: proposalFee - discountAmount,
    proposal_status: baseRow.proposal_status,
    proposal_issuer_company: baseRow.proposal_issuer_company ?? null,
    latest_proposal_document_name: latest_prop_doc?.document_name ?? null,
    latest_proposal_document_path: latest_prop_doc?.file_path ?? null,
    latest_proposal_document_version: latest_prop_doc?.version_no ?? null,
    latest_proposal_document_uploaded_at: latest_prop_doc?.created_at ?? null
  };
};

const fetchLatestProposalRowForLead = async (conn, leadId) => {
  const [rows] = await conn.execute(
    `SELECT
        p.proposal_id,
        p.proposal_code,
        p.proposal_fee,
        p.discount_amount,
        p.proposal_status,
        p.issuer_company AS proposal_issuer_company,
        s.name AS service_name,
        sc.name AS service_class_name
      FROM proposals p
      INNER JOIN services s ON s.service_id = p.service_id
      INNER JOIN service_classes sc ON sc.service_class_id = s.service_class_id
     WHERE p.lead_id = ?
     ORDER BY p.updated_at DESC, p.proposal_id DESC
     LIMIT 1`,
    [leadId]
  );
  return rows[0] ?? null;
};

const buildEngagementWorkspaceItem = async (conn, baseRow) => {
  const engagementId = baseRow.engagement_id;
  const [termins, retainer, latest_el_doc, proposal_summary] = await Promise.all([
    fetchTermins(conn, engagementId),
    fetchRetainer(conn, engagementId),
    fetchLatestEngagementDocument(conn, engagementId),
    buildProposalSummaryPayload(conn, baseRow)
  ]);

  return {
    engagement: {
      engagement_id: engagementId,
      engagement_code: baseRow.engagement_code ?? null,
      lead_id: baseRow.lead_id,
      proposal_id: baseRow.proposal_id,
      issuer_company: baseRow.issuer_company,
      agreed_fee: baseRow.agreed_fee != null ? Number(baseRow.agreed_fee) : null,
      payment_method: baseRow.payment_method,
      engagement_status: baseRow.engagement_status,
      revision_note: baseRow.revision_note ?? null,
      created_by: baseRow.created_by,
      created_by_name: baseRow.created_by_name ?? null,
      created_at: baseRow.created_at,
      submitted_by: baseRow.submitted_by ?? null,
      submitted_by_name: baseRow.submitted_by_name ?? null,
      submitted_at: baseRow.submitted_at ?? null,
      approved_by: baseRow.approved_by ?? null,
      approved_by_name: baseRow.approved_by_name ?? null,
      approved_at: baseRow.approved_at ?? null,
      sent_to_client_at: baseRow.sent_to_client_at ?? null,
      signed_at: baseRow.signed_at ?? null,
      updated_at: baseRow.updated_at
    },
    proposal_summary,
    termins,
    retainer,
    latest_engagement_document: latest_el_doc
      ? {
          latest_document_name: latest_el_doc.document_name,
          latest_document_path: latest_el_doc.file_path,
          latest_document_version: latest_el_doc.version_no,
          latest_document_uploaded_at: latest_el_doc.created_at,
          latest_document_size_bytes: latest_el_doc.file_size_bytes,
          latest_document_mime_type: latest_el_doc.mime_type
        }
      : null
  };
};

/**
 * GET workspace engagement letters for a lead (read-only).
 * Verifies lead is visible in workspace (same rule as lead detail).
 */
const getEngagementLetterWorkspaceBundle = async (leadIdRaw) => {
  const leadId = normalizeLeadId(leadIdRaw);
  if (leadId == null) {
    return { ok: false, reason: 'INVALID_LEAD_ID' };
  }

  const conn = await pool.getConnection();
  try {
    const entry = await leadWorkspaceRepo.findWorkspaceDetail(leadId);
    if (!entry) {
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const lead_summary = await fetchLeadSummaryByLeadId(conn, leadId);

    const [engRows] = await conn.execute(`${engagementBaseSelect} WHERE e.lead_id = ? ORDER BY e.updated_at DESC, e.engagement_id DESC`, [
      leadId
    ]);

    const items = await Promise.all(engRows.map((row) => buildEngagementWorkspaceItem(conn, row)));

    let proposal_without_engagement = null;
    if (items.length === 0) {
      const pr = await fetchLatestProposalRowForLead(conn, leadId);
      if (pr) {
        proposal_without_engagement = await buildProposalSummaryPayload(conn, pr);
      }
    }

    return { ok: true, data: { lead_summary, items, proposal_without_engagement } };
  } finally {
    conn.release();
  }
};

/**
 * Single engagement workspace item by engagement_id (must belong to lead).
 */
const getEngagementWorkspaceItemForLead = async (leadIdRaw, engagementIdRaw) => {
  const leadId = normalizeLeadId(leadIdRaw);
  const engagementId = normalizeEngagementId(engagementIdRaw);
  if (leadId == null || engagementId == null) {
    return { ok: false, reason: 'INVALID_ID' };
  }

  const conn = await pool.getConnection();
  try {
    const entry = await leadWorkspaceRepo.findWorkspaceDetail(leadId);
    if (!entry) {
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const [rows] = await conn.execute(`${engagementBaseSelect} WHERE e.engagement_id = ? AND e.lead_id = ? LIMIT 1`, [
      engagementId,
      leadId
    ]);
    if (!rows[0]) {
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const lead_summary = await fetchLeadSummaryByLeadId(conn, leadId);
    const item = await buildEngagementWorkspaceItem(conn, rows[0]);
    return { ok: true, data: { lead_summary, item } };
  } finally {
    conn.release();
  }
};

module.exports = {
  getEngagementLetterWorkspaceBundle,
  getEngagementWorkspaceItemForLead,
  fetchLeadSummaryByLeadId,
  buildEngagementWorkspaceItem,
  engagementBaseSelect,
  normalizeEngagementId,
  normalizeLeadId
};
