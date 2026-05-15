const { pool } = require('../config/db');
const { LEAD_ACTIVITY_TYPES } = require('../constants/lead-activity-types');
const { formatLeadSourceLabel } = require('../utils/lead-source-label');

const normalizeProposalId = (proposalId) => {
  if (proposalId === undefined || proposalId === null) {
    return null;
  }
  const n = Number(proposalId);
  if (!Number.isSafeInteger(n) || n <= 0) {
    return null;
  }
  return n;
};

const insertActivityLog = async (conn, { leadId, activityType, title, description, createdBy }) => {
  await conn.execute(
    `INSERT INTO lead_activity_logs (lead_id, activity_type, title, description, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [leadId, activityType, title, description, createdBy]
  );
};

const mapDocumentRow = (row) => {
  if (!row || row.document_id == null) {
    return null;
  }
  return {
    document_id: row.document_id,
    lead_id: row.lead_id,
    proposal_id: row.proposal_id,
    document_category: row.document_category,
    document_name: row.document_name,
    version_no: row.version_no,
    is_latest: Boolean(row.is_latest),
    file_name: row.file_name,
    file_path: row.file_path,
    mime_type: row.mime_type ?? null,
    file_size_bytes: row.file_size_bytes ?? null,
    uploaded_by: row.uploaded_by ?? null,
    uploaded_by_name: row.uploaded_by_name ?? null,
    created_at: row.created_at
  };
};

const mapLeadSummaryRow = (row) => ({
  company_name: row.company_name ?? null,
  pic_name: row.pic_name ?? null,
  email: row.email ?? null,
  phone_number: row.phone_number ?? null,
  lead_source_label:
    row.source_type === 'MANUAL'
      ? 'Manual'
      : formatLeadSourceLabel(row.link_type, row.channel_code, row.channel_name),
  processed_by_name: row.processed_by_name ?? null,
  processed_at: row.processed_at ?? null,
  desired_services: row.desired_services ?? null
});

const mapProposalRow = (row, document) => ({
  proposal_id: row.proposal_id,
  proposal_code: row.proposal_code ?? null,
  lead_id: row.lead_id,
  company_name: row.company_name,
  service_id: row.service_id,
  service_name: row.service_name,
  service_code: row.service_code,
  service_class_id: row.service_class_id,
  service_class_name: row.service_class_name,
  service_class_code: row.service_class_code,
  department_id: row.department_id,
  issuer_company: row.issuer_company,
  is_sub_contract: Boolean(row.is_sub_contract),
  partner_name: row.partner_name ?? null,
  payer_party: row.payer_party ?? null,
  proposal_fee: Number(row.proposal_fee),
  discount_amount: Number(row.discount_amount),
  proposal_status: row.proposal_status,
  revision_note: row.revision_note ?? null,
  approved_by: row.approved_by ?? null,
  approved_at: row.approved_at ?? null,
  submitted_by: row.submitted_by ?? null,
  submitted_by_name: row.submitted_by_name ?? null,
  submitted_at: row.submitted_at ?? null,
  created_by: row.created_by,
  created_by_name: row.created_by_name ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
  document: document ?? null
});

const mapPendingListRow = (row) => ({
  approval_id: row.approval_id,
  proposal_id: row.proposal_id,
  proposal_code: row.proposal_code ?? null,
  lead_id: row.lead_id,
  company_name: row.company_name,
  service_class_name: row.service_class_name,
  service_name: row.service_name,
  issuer_company: row.issuer_company,
  proposal_fee: Number(row.proposal_fee),
  discount_amount: Number(row.discount_amount),
  final_fee: Number(row.proposal_fee) - Number(row.discount_amount),
  submitted_by_name: row.submitted_by_name ?? null,
  submitted_at: row.submitted_at ?? null,
  proposal_status: row.proposal_status,
  document: mapDocumentRow(row)
});

const proposalSelectSql = `
  SELECT
      p.proposal_id,
      p.proposal_code,
      p.lead_id,
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
      ch.name AS channel_name,
      p.service_id,
      s.name AS service_name,
      s.code AS service_code,
      s.service_class_id,
      sc.name AS service_class_name,
      sc.code AS service_class_code,
      s.department_id,
      p.issuer_company,
      p.is_sub_contract,
      p.partner_name,
      p.payer_party,
      p.proposal_fee,
      p.discount_amount,
      p.proposal_status,
      p.revision_note,
      p.approved_by,
      p.approved_at,
      p.submitted_by,
      p.submitted_at,
      p.created_by,
      p.created_at,
      p.updated_at,
      uc.name AS created_by_name,
      us.name AS submitted_by_name,
      d.document_id,
      d.lead_id AS document_lead_id,
      d.proposal_id AS document_proposal_id,
      d.document_category,
      d.document_name,
      d.version_no,
      d.is_latest,
      d.file_name,
      d.file_path,
      d.mime_type,
      d.file_size_bytes,
      d.uploaded_by,
      d.created_at AS document_created_at,
      du.name AS uploaded_by_name
    FROM proposals p
    INNER JOIN leads l ON l.lead_id = p.lead_id
    INNER JOIN services s ON s.service_id = p.service_id
    INNER JOIN service_classes sc ON sc.service_class_id = s.service_class_id
    LEFT JOIN users uc ON uc.id = p.created_by
    LEFT JOIN users us ON us.id = p.submitted_by
    LEFT JOIN users upb ON upb.id = l.processed_by
    LEFT JOIN form_distribution_links fdl ON fdl.distribution_link_id = l.distribution_link_id
    LEFT JOIN form_channels ch ON ch.channel_id = fdl.channel_id
    LEFT JOIN documents d
      ON d.proposal_id = p.proposal_id
     AND d.document_category = 'PROPOSAL'
     AND d.is_latest = 1
    LEFT JOIN users du ON du.id = d.uploaded_by
`;

const fetchPendingApproval = async (conn, proposalId) => {
  const [rows] = await conn.execute(
    `SELECT approval_id, proposal_id, sequence_no, decision, note, decided_at, created_at
       FROM approvals
      WHERE proposal_id = ?
        AND approval_role = 'CEO'
        AND decision = 'PENDING'
      ORDER BY sequence_no DESC, approval_id DESC
      LIMIT 1`,
    [proposalId]
  );
  return rows[0] ?? null;
};

const fetchProposalDetail = async (conn, proposalId) => {
  const [rows] = await conn.execute(
    `${proposalSelectSql}
     WHERE p.proposal_id = ?`,
    [proposalId]
  );
  if (!rows[0]) {
    return null;
  }
  const row = rows[0];
  const document = mapDocumentRow({
    document_id: row.document_id,
    lead_id: row.document_lead_id,
    proposal_id: row.document_proposal_id,
    document_category: row.document_category,
    document_name: row.document_name,
    version_no: row.version_no,
    is_latest: row.is_latest,
    file_name: row.file_name,
    file_path: row.file_path,
    mime_type: row.mime_type,
    file_size_bytes: row.file_size_bytes,
    uploaded_by: row.uploaded_by,
    created_at: row.document_created_at,
    uploaded_by_name: row.uploaded_by_name
  });
  return {
    proposal: mapProposalRow(row, document),
    lead_summary: mapLeadSummaryRow(row)
  };
};

const listPendingProposals = async () => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT
          a.approval_id,
          p.proposal_id,
          p.proposal_code,
          p.lead_id,
          l.company_name,
          sc.name AS service_class_name,
          s.name AS service_name,
          p.issuer_company,
          p.proposal_fee,
          p.discount_amount,
          us.name AS submitted_by_name,
          p.submitted_at,
          p.proposal_status,
          d.document_id,
          d.lead_id AS document_lead_id,
          d.proposal_id AS document_proposal_id,
          d.document_category,
          d.document_name,
          d.version_no,
          d.is_latest,
          d.file_name,
          d.file_path,
          d.mime_type,
          d.file_size_bytes,
          d.uploaded_by,
          d.created_at AS document_created_at,
          du.name AS uploaded_by_name
        FROM approvals a
        INNER JOIN proposals p ON p.proposal_id = a.proposal_id
        INNER JOIN leads l ON l.lead_id = p.lead_id
        INNER JOIN services s ON s.service_id = p.service_id
        INNER JOIN service_classes sc ON sc.service_class_id = s.service_class_id
        LEFT JOIN users us ON us.id = p.submitted_by
        LEFT JOIN documents d
          ON d.proposal_id = p.proposal_id
         AND d.document_category = 'PROPOSAL'
         AND d.is_latest = 1
        LEFT JOIN users du ON du.id = d.uploaded_by
       WHERE a.approval_role = 'CEO'
         AND a.decision = 'PENDING'
         AND p.proposal_status = 'WAITING_CEO_APPROVAL'
       ORDER BY p.submitted_at DESC, p.proposal_id DESC`
    );
    return { ok: true, items: rows.map(mapPendingListRow) };
  } finally {
    conn.release();
  }
};

const getPendingProposalDetail = async (proposalId) => {
  const normalizedProposalId = normalizeProposalId(proposalId);
  if (normalizedProposalId == null) {
    return { ok: false, reason: 'INVALID_PROPOSAL_ID' };
  }

  const conn = await pool.getConnection();
  try {
    const detail = await fetchProposalDetail(conn, normalizedProposalId);
    if (!detail) {
      return { ok: false, reason: 'NOT_FOUND' };
    }
    const { proposal, lead_summary: leadSummary } = detail;
    if (proposal.proposal_status !== 'WAITING_CEO_APPROVAL') {
      return { ok: false, reason: 'NOT_PENDING' };
    }

    const approval = await fetchPendingApproval(conn, normalizedProposalId);
    if (!approval) {
      return { ok: false, reason: 'APPROVAL_NOT_FOUND' };
    }

    return {
      ok: true,
      proposal,
      lead_summary: leadSummary,
      approval: {
        approval_id: approval.approval_id,
        proposal_id: approval.proposal_id,
        sequence_no: approval.sequence_no,
        decision: approval.decision,
        note: approval.note ?? null,
        decided_at: approval.decided_at ?? null,
        created_at: approval.created_at
      }
    };
  } finally {
    conn.release();
  }
};

const approveProposal = async (proposalId, userId) => {
  const normalizedProposalId = normalizeProposalId(proposalId);
  if (normalizedProposalId == null) {
    return { ok: false, reason: 'INVALID_PROPOSAL_ID' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [proposalRows] = await conn.execute(
      `SELECT proposal_id, lead_id, proposal_status
         FROM proposals
        WHERE proposal_id = ?
        FOR UPDATE`,
      [normalizedProposalId]
    );
    const proposalRow = proposalRows[0];
    if (!proposalRow) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (proposalRow.proposal_status !== 'WAITING_CEO_APPROVAL') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_PENDING' };
    }

    const approval = await fetchPendingApproval(conn, normalizedProposalId);
    if (!approval) {
      await conn.rollback();
      return { ok: false, reason: 'APPROVAL_NOT_FOUND' };
    }

    const [approvalUpdate] = await conn.execute(
      `UPDATE approvals
          SET decision = 'APPROVED',
              note = NULL,
              decided_at = NOW()
        WHERE approval_id = ?
          AND decision = 'PENDING'`,
      [approval.approval_id]
    );
    if (approvalUpdate.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'APPROVAL_ALREADY_DECIDED' };
    }

    const [proposalUpdate] = await conn.execute(
      `UPDATE proposals
          SET proposal_status = 'APPROVED',
              approved_by = ?,
              approved_at = NOW()
        WHERE proposal_id = ?
          AND proposal_status = 'WAITING_CEO_APPROVAL'`,
      [userId, normalizedProposalId]
    );
    if (proposalUpdate.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_PENDING' };
    }

    await conn.execute(
      `UPDATE leads
          SET current_stage = 'PROPOSAL',
              stage_progress = 'APPROVED',
              next_action = 'Kirim proposal ke client',
              due_date = DATE_ADD(NOW(), INTERVAL 1 DAY)
        WHERE lead_id = ?`,
      [proposalRow.lead_id]
    );

    await insertActivityLog(conn, {
      leadId: proposalRow.lead_id,
      activityType: LEAD_ACTIVITY_TYPES.PROPOSAL_APPROVED,
      title: 'Proposal disetujui CEO',
      description: 'Proposal disetujui CEO dan siap dikirim ke client.',
      createdBy: userId
    });

    await conn.commit();
    const detail = await fetchProposalDetail(conn, normalizedProposalId);
    return { ok: true, proposal: detail?.proposal ?? null };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const rejectProposal = async (proposalId, note, userId) => {
  const normalizedProposalId = normalizeProposalId(proposalId);
  if (normalizedProposalId == null) {
    return { ok: false, reason: 'INVALID_PROPOSAL_ID' };
  }

  const trimmedNote = typeof note === 'string' ? note.trim() : '';
  if (!trimmedNote) {
    return { ok: false, reason: 'NOTE_REQUIRED' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [proposalRows] = await conn.execute(
      `SELECT proposal_id, lead_id, proposal_status
         FROM proposals
        WHERE proposal_id = ?
        FOR UPDATE`,
      [normalizedProposalId]
    );
    const proposalRow = proposalRows[0];
    if (!proposalRow) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (proposalRow.proposal_status !== 'WAITING_CEO_APPROVAL') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_PENDING' };
    }

    const approval = await fetchPendingApproval(conn, normalizedProposalId);
    if (!approval) {
      await conn.rollback();
      return { ok: false, reason: 'APPROVAL_NOT_FOUND' };
    }

    const [approvalUpdate] = await conn.execute(
      `UPDATE approvals
          SET decision = 'REJECTED',
              note = ?,
              decided_at = NOW()
        WHERE approval_id = ?
          AND decision = 'PENDING'`,
      [trimmedNote, approval.approval_id]
    );
    if (approvalUpdate.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'APPROVAL_ALREADY_DECIDED' };
    }

    const [proposalUpdate] = await conn.execute(
      `UPDATE proposals
          SET proposal_status = 'NEED_REVISION',
              revision_note = ?
        WHERE proposal_id = ?
          AND proposal_status = 'WAITING_CEO_APPROVAL'`,
      [trimmedNote, normalizedProposalId]
    );
    if (proposalUpdate.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_PENDING' };
    }

    await conn.execute(
      `UPDATE leads
          SET current_stage = 'PROPOSAL',
              stage_progress = 'REVISION',
              next_action = 'Revisi proposal',
              due_date = DATE_ADD(NOW(), INTERVAL 1 DAY)
        WHERE lead_id = ?`,
      [proposalRow.lead_id]
    );

    await insertActivityLog(conn, {
      leadId: proposalRow.lead_id,
      activityType: LEAD_ACTIVITY_TYPES.PROPOSAL_REVISION_REQUESTED,
      title: 'CEO minta revisi proposal',
      description: trimmedNote,
      createdBy: userId
    });

    await conn.commit();
    const detail = await fetchProposalDetail(conn, normalizedProposalId);
    return { ok: true, proposal: detail?.proposal ?? null };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

module.exports = {
  listPendingProposals,
  getPendingProposalDetail,
  approveProposal,
  rejectProposal
};
