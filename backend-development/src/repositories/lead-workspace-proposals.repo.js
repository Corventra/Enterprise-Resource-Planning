const { pool } = require('../config/db');
const { LEAD_ACTIVITY_TYPES } = require('../constants/lead-activity-types');
const { safeUnlinkOldUploadFile } = require('../utils/file');
const { generateNextProposalCode } = require('../utils/entity-display-code');
const {
  PROPOSAL_REQUIRES_MINUTES_MESSAGE,
  LEAD_HAS_PROPOSAL_MESSAGE,
  leadHasMinutes,
  leadHasProposal
} = require('../utils/lead-workspace-readiness');

const ELIGIBLE_LEAD_WHERE = `
  lead_status IN ('ACTIVE', 'WON', 'LOST')
  AND (
    (source_type = 'FORM_LEAD_CAPTURE' AND bank_data_status = 'PROCESSED')
    OR source_type = 'MANUAL'
  )
`;

const normalizeLeadId = (leadId) => {
  if (leadId === undefined || leadId === null) {
    return null;
  }
  const n = Number(leadId);
  if (!Number.isSafeInteger(n) || n <= 0) {
    return null;
  }
  return n;
};

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

const EDITABLE_PROPOSAL_STATUSES = new Set(['DRAFT', 'NEED_REVISION']);

const isEditableProposalStatus = (status) => EDITABLE_PROPOSAL_STATUSES.has(status);

const applyProposalSubmission = async (conn, { leadId, proposalId, userId }) => {
  const latestDocument = await fetchLatestDocument(conn, proposalId);
  if (!latestDocument) {
    return { ok: false, reason: 'DOCUMENT_REQUIRED' };
  }

  await conn.execute(
    `UPDATE proposals
        SET proposal_status = 'WAITING_CEO_APPROVAL',
            submitted_by = ?,
            submitted_at = NOW()
      WHERE proposal_id = ?
        AND lead_id = ?`,
    [userId, proposalId, leadId]
  );

  const [approvalRows] = await conn.execute(
    `SELECT COALESCE(MAX(sequence_no), 0) AS max_sequence
       FROM approvals
      WHERE proposal_id = ?`,
    [proposalId]
  );
  const sequenceNo = Number(approvalRows[0].max_sequence) + 1;

  await conn.execute(
    `INSERT INTO approvals (
        proposal_id,
        approval_role,
        sequence_no,
        decision
      ) VALUES (?, 'CEO', ?, 'PENDING')`,
    [proposalId, sequenceNo]
  );

  await conn.execute(
    `UPDATE leads
        SET current_stage = 'PROPOSAL',
            stage_progress = 'WAITING_CEO_APPROVAL',
            next_action = 'Tunggu review CEO',
            due_date = NULL
      WHERE lead_id = ?`,
    [leadId]
  );

  await insertActivityLog(conn, {
    leadId,
    activityType: LEAD_ACTIVITY_TYPES.PROPOSAL_SUBMITTED,
    title: 'Proposal diajukan',
    description: 'Proposal diajukan untuk persetujuan CEO.',
    createdBy: userId
  });

  return { ok: true };
};

const mapDocumentRow = (row) => ({
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
});

const mapProposalRow = (row, document) => ({
  proposal_id: row.proposal_id,
  proposal_code: row.proposal_code ?? null,
  lead_id: row.lead_id,
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
  sent_to_client_at: row.sent_to_client_at ?? null,
  client_responded_at: row.client_responded_at ?? null,
  submitted_by: row.submitted_by ?? null,
  submitted_by_name: row.submitted_by_name ?? null,
  submitted_at: row.submitted_at ?? null,
  created_by: row.created_by,
  created_by_name: row.created_by_name ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
  document: document ?? null
});

const fetchEligibleLead = async (conn, leadId) => {
  const [rows] = await conn.execute(
    `SELECT lead_id, current_stage, stage_progress, next_action, due_date
       FROM leads
      WHERE lead_id = ?
        AND ${ELIGIBLE_LEAD_WHERE}`,
    [leadId]
  );
  return rows[0] ?? null;
};

const fetchLatestDocument = async (conn, proposalId) => {
  const [rows] = await conn.execute(
    `SELECT
        d.document_id,
        d.lead_id,
        d.proposal_id,
        d.document_category,
        d.document_name,
        d.version_no,
        d.is_latest,
        d.file_name,
        d.file_path,
        d.mime_type,
        d.file_size_bytes,
        d.uploaded_by,
        d.created_at,
        u.name AS uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON u.id = d.uploaded_by
     WHERE d.proposal_id = ?
       AND d.document_category = 'PROPOSAL'
       AND d.is_latest = 1
     ORDER BY d.document_id DESC
     LIMIT 1`,
    [proposalId]
  );
  return rows[0] ? mapDocumentRow(rows[0]) : null;
};

const fetchProposalDetail = async (conn, leadId, proposalId) => {
  const [rows] = await conn.execute(
    `SELECT
        p.proposal_id,
        p.proposal_code,
        p.lead_id,
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
        p.sent_to_client_at,
        p.client_responded_at,
        p.submitted_by,
        p.submitted_at,
        p.created_by,
        p.created_at,
        p.updated_at,
        uc.name AS created_by_name,
        us.name AS submitted_by_name
      FROM proposals p
      INNER JOIN services s ON s.service_id = p.service_id
      INNER JOIN service_classes sc ON sc.service_class_id = s.service_class_id
      LEFT JOIN users uc ON uc.id = p.created_by
      LEFT JOIN users us ON us.id = p.submitted_by
     WHERE p.proposal_id = ?
       AND p.lead_id = ?`,
    [proposalId, leadId]
  );
  if (!rows[0]) {
    return null;
  }
  const document = await fetchLatestDocument(conn, proposalId);
  return mapProposalRow(rows[0], document);
};

const fetchLatestProposalForLead = async (leadId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  if (normalizedLeadId == null) {
    return { ok: false, reason: 'INVALID_LEAD_ID' };
  }

  const conn = await pool.getConnection();
  try {
    const lead = await fetchEligibleLead(conn, normalizedLeadId);
    if (!lead) {
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const [rows] = await conn.execute(
      `SELECT proposal_id
         FROM proposals
        WHERE lead_id = ?
        ORDER BY proposal_id DESC
        LIMIT 1`,
      [normalizedLeadId]
    );

    if (!rows[0]) {
      return { ok: true, proposal: null };
    }

    const proposal = await fetchProposalDetail(conn, normalizedLeadId, rows[0].proposal_id);
    return { ok: true, proposal };
  } finally {
    conn.release();
  }
};

const findActiveService = async (conn, serviceId) => {
  const [rows] = await conn.execute(
    `SELECT service_id, name, is_active
       FROM services
      WHERE service_id = ?`,
    [serviceId]
  );
  return rows[0] ?? null;
};

const insertProposalDocument = async (conn, {
  leadId,
  proposalId,
  documentName,
  fileName,
  filePath,
  mimeType,
  fileSizeBytes,
  uploadedBy,
  versionNo
}) => {
  const [result] = await conn.execute(
    `INSERT INTO documents (
        lead_id,
        proposal_id,
        document_category,
        document_name,
        version_no,
        is_latest,
        file_name,
        file_path,
        mime_type,
        file_size_bytes,
        uploaded_by
      ) VALUES (?, ?, 'PROPOSAL', ?, ?, 1, ?, ?, ?, ?, ?)`,
    [
      leadId,
      proposalId,
      documentName,
      versionNo,
      fileName,
      filePath,
      mimeType,
      fileSizeBytes,
      uploadedBy
    ]
  );
  return result.insertId;
};

const markPreviousDocumentsNotLatest = async (conn, proposalId) => {
  await conn.execute(
    `UPDATE documents
        SET is_latest = 0
      WHERE proposal_id = ?
        AND document_category = 'PROPOSAL'`,
    [proposalId]
  );
};

const getNextDocumentVersion = async (conn, proposalId) => {
  const [rows] = await conn.execute(
    `SELECT COALESCE(MAX(version_no), 0) AS max_version
       FROM documents
      WHERE proposal_id = ?
        AND document_category = 'PROPOSAL'`,
    [proposalId]
  );
  return Number(rows[0].max_version) + 1;
};

const cleanupProposalDocuments = async (conn, proposalId) => {
  const [rows] = await conn.execute(
    `SELECT file_path
       FROM documents
      WHERE proposal_id = ?
        AND document_category = 'PROPOSAL'`,
    [proposalId]
  );
  for (const row of rows) {
    await safeUnlinkOldUploadFile(row.file_path);
  }
  await conn.execute(
    `DELETE FROM documents
      WHERE proposal_id = ?
        AND document_category = 'PROPOSAL'`,
    [proposalId]
  );
};

const createDraftProposal = async (leadId, payload, fileMeta, userId, { submit = false } = {}) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  if (normalizedLeadId == null) {
    return { ok: false, reason: 'INVALID_LEAD_ID' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const lead = await fetchEligibleLead(conn, normalizedLeadId);
    if (!lead) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const hasMinutes = await leadHasMinutes(conn, normalizedLeadId);
    if (!hasMinutes) {
      await conn.rollback();
      return {
        ok: false,
        reason: 'MINUTES_REQUIRED',
        message: PROPOSAL_REQUIRES_MINUTES_MESSAGE
      };
    }

    const proposalExists = await leadHasProposal(conn, normalizedLeadId);
    if (proposalExists) {
      await conn.rollback();
      return {
        ok: false,
        reason: 'PROPOSAL_EXISTS',
        message: LEAD_HAS_PROPOSAL_MESSAGE
      };
    }

    const service = await findActiveService(conn, payload.service_id);
    if (!service) {
      await conn.rollback();
      return { ok: false, reason: 'SERVICE_NOT_FOUND' };
    }
    if (!service.is_active) {
      await conn.rollback();
      return { ok: false, reason: 'SERVICE_INACTIVE' };
    }

    const [insertResult] = await (async () => {
      let lastErr;
      for (let attempt = 0; attempt < 15; attempt++) {
        const proposalCode = await generateNextProposalCode(conn);
        try {
          const [r] = await conn.execute(
            `INSERT INTO proposals (
          proposal_code,
          lead_id,
          service_id,
          issuer_company,
          is_sub_contract,
          partner_name,
          payer_party,
          proposal_fee,
          discount_amount,
          proposal_status,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?)`,
            [
              proposalCode,
              normalizedLeadId,
              payload.service_id,
              payload.issuer_company,
              payload.is_sub_contract ? 1 : 0,
              payload.partner_name,
              payload.payer_party,
              payload.proposal_fee,
              payload.discount_amount,
              userId
            ]
          );
          return [r];
        } catch (e) {
          lastErr = e;
          if (e.code === 'ER_DUP_ENTRY') {
            continue;
          }
          throw e;
        }
      }
      throw lastErr ?? new Error('Gagal menetapkan proposal_code');
    })();

    const proposalId = insertResult.insertId;
    await insertProposalDocument(conn, {
      leadId: normalizedLeadId,
      proposalId,
      documentName: fileMeta.documentName,
      fileName: fileMeta.fileName,
      filePath: fileMeta.filePath,
      mimeType: fileMeta.mimeType,
      fileSizeBytes: fileMeta.fileSizeBytes,
      uploadedBy: userId,
      versionNo: 1
    });

    if (submit) {
      const submission = await applyProposalSubmission(conn, {
        leadId: normalizedLeadId,
        proposalId,
        userId
      });
      if (!submission.ok) {
        await conn.rollback();
        return submission;
      }
    }

    await conn.commit();
    const proposal = await fetchProposalDetail(conn, normalizedLeadId, proposalId);
    return { ok: true, proposal };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const updateDraftProposal = async (leadId, proposalId, payload, fileMeta, userId, { submit = false } = {}) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  const normalizedProposalId = normalizeProposalId(proposalId);
  if (normalizedLeadId == null || normalizedProposalId == null) {
    return { ok: false, reason: 'INVALID_ID' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const lead = await fetchEligibleLead(conn, normalizedLeadId);
    if (!lead) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const [proposalRows] = await conn.execute(
      `SELECT proposal_id, proposal_status
         FROM proposals
        WHERE proposal_id = ?
          AND lead_id = ?`,
      [normalizedProposalId, normalizedLeadId]
    );
    if (!proposalRows[0]) {
      await conn.rollback();
      return { ok: false, reason: 'PROPOSAL_NOT_FOUND' };
    }
    if (!isEditableProposalStatus(proposalRows[0].proposal_status)) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_EDITABLE' };
    }

    const service = await findActiveService(conn, payload.service_id);
    if (!service) {
      await conn.rollback();
      return { ok: false, reason: 'SERVICE_NOT_FOUND' };
    }
    if (!service.is_active) {
      await conn.rollback();
      return { ok: false, reason: 'SERVICE_INACTIVE' };
    }

    await conn.execute(
      `UPDATE proposals
          SET service_id = ?,
              issuer_company = ?,
              is_sub_contract = ?,
              partner_name = ?,
              payer_party = ?,
              proposal_fee = ?,
              discount_amount = ?
        WHERE proposal_id = ?
          AND lead_id = ?`,
      [
        payload.service_id,
        payload.issuer_company,
        payload.is_sub_contract ? 1 : 0,
        payload.partner_name,
        payload.payer_party,
        payload.proposal_fee,
        payload.discount_amount,
        normalizedProposalId,
        normalizedLeadId
      ]
    );

    if (fileMeta) {
      const oldDocument = await fetchLatestDocument(conn, normalizedProposalId);
      await markPreviousDocumentsNotLatest(conn, normalizedProposalId);
      const versionNo = await getNextDocumentVersion(conn, normalizedProposalId);
      await insertProposalDocument(conn, {
        leadId: normalizedLeadId,
        proposalId: normalizedProposalId,
        documentName: fileMeta.documentName,
        fileName: fileMeta.fileName,
        filePath: fileMeta.filePath,
        mimeType: fileMeta.mimeType,
        fileSizeBytes: fileMeta.fileSizeBytes,
        uploadedBy: userId,
        versionNo
      });
      if (oldDocument?.file_path) {
        await safeUnlinkOldUploadFile(oldDocument.file_path);
      }
    }

    if (submit) {
      const submission = await applyProposalSubmission(conn, {
        leadId: normalizedLeadId,
        proposalId: normalizedProposalId,
        userId
      });
      if (!submission.ok) {
        await conn.rollback();
        return submission;
      }
    }

    await conn.commit();
    const proposal = await fetchProposalDetail(conn, normalizedLeadId, normalizedProposalId);
    return { ok: true, proposal };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const deleteDraftProposal = async (leadId, proposalId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  const normalizedProposalId = normalizeProposalId(proposalId);
  if (normalizedLeadId == null || normalizedProposalId == null) {
    return { ok: false, reason: 'INVALID_ID' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const lead = await fetchEligibleLead(conn, normalizedLeadId);
    if (!lead) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const [proposalRows] = await conn.execute(
      `SELECT proposal_id, proposal_status
         FROM proposals
        WHERE proposal_id = ?
          AND lead_id = ?`,
      [normalizedProposalId, normalizedLeadId]
    );
    if (!proposalRows[0]) {
      await conn.rollback();
      return { ok: false, reason: 'PROPOSAL_NOT_FOUND' };
    }
    if (proposalRows[0].proposal_status !== 'DRAFT') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_DRAFT' };
    }

    await cleanupProposalDocuments(conn, normalizedProposalId);
    await conn.execute(
      `DELETE FROM proposals
        WHERE proposal_id = ?
          AND lead_id = ?`,
      [normalizedProposalId, normalizedLeadId]
    );

    await conn.commit();
    return { ok: true };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const submitDraftProposal = async (leadId, proposalId, userId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  const normalizedProposalId = normalizeProposalId(proposalId);
  if (normalizedLeadId == null || normalizedProposalId == null) {
    return { ok: false, reason: 'INVALID_ID' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const lead = await fetchEligibleLead(conn, normalizedLeadId);
    if (!lead) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const [proposalRows] = await conn.execute(
      `SELECT proposal_id, proposal_status
         FROM proposals
        WHERE proposal_id = ?
          AND lead_id = ?`,
      [normalizedProposalId, normalizedLeadId]
    );
    if (!proposalRows[0]) {
      await conn.rollback();
      return { ok: false, reason: 'PROPOSAL_NOT_FOUND' };
    }
    if (!isEditableProposalStatus(proposalRows[0].proposal_status)) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_EDITABLE' };
    }

    const submission = await applyProposalSubmission(conn, {
      leadId: normalizedLeadId,
      proposalId: normalizedProposalId,
      userId
    });
    if (!submission.ok) {
      await conn.rollback();
      return submission;
    }

    await conn.commit();
    const proposal = await fetchProposalDetail(conn, normalizedLeadId, normalizedProposalId);
    return { ok: true, proposal };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const markProposalSentToClient = async (leadId, proposalId, userId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  const normalizedProposalId = normalizeProposalId(proposalId);
  if (normalizedLeadId == null || normalizedProposalId == null) {
    return { ok: false, reason: 'INVALID_ID' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const lead = await fetchEligibleLead(conn, normalizedLeadId);
    if (!lead) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const [proposalRows] = await conn.execute(
      `SELECT proposal_id, proposal_status
         FROM proposals
        WHERE proposal_id = ?
          AND lead_id = ?
        FOR UPDATE`,
      [normalizedProposalId, normalizedLeadId]
    );
    if (!proposalRows[0]) {
      await conn.rollback();
      return { ok: false, reason: 'PROPOSAL_NOT_FOUND' };
    }
    if (proposalRows[0].proposal_status !== 'APPROVED') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_APPROVED' };
    }

    const [proposalUpdate] = await conn.execute(
      `UPDATE proposals
          SET proposal_status = 'SENT',
              sent_to_client_at = NOW()
        WHERE proposal_id = ?
          AND lead_id = ?
          AND proposal_status = 'APPROVED'`,
      [normalizedProposalId, normalizedLeadId]
    );
    if (proposalUpdate.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_APPROVED' };
    }

    await conn.execute(
      `UPDATE leads
          SET current_stage = 'PROPOSAL',
              stage_progress = 'SENT',
              next_action = 'Tunggu respons client',
              due_date = DATE_ADD(NOW(), INTERVAL 7 DAY)
        WHERE lead_id = ?`,
      [normalizedLeadId]
    );

    await insertActivityLog(conn, {
      leadId: normalizedLeadId,
      activityType: LEAD_ACTIVITY_TYPES.PROPOSAL_SENT,
      title: 'Proposal dikirim ke client',
      description: 'Proposal ditandai terkirim dan lead menunggu respons client.',
      createdBy: userId
    });

    await conn.commit();
    const proposal = await fetchProposalDetail(conn, normalizedLeadId, normalizedProposalId);
    return { ok: true, proposal };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const markProposalResponded = async (leadId, proposalId, userId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  const normalizedProposalId = normalizeProposalId(proposalId);
  if (normalizedLeadId == null || normalizedProposalId == null) {
    return { ok: false, reason: 'INVALID_ID' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const lead = await fetchEligibleLead(conn, normalizedLeadId);
    if (!lead) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const [proposalRows] = await conn.execute(
      `SELECT proposal_id, proposal_status
         FROM proposals
        WHERE proposal_id = ?
          AND lead_id = ?
        FOR UPDATE`,
      [normalizedProposalId, normalizedLeadId]
    );
    if (!proposalRows[0]) {
      await conn.rollback();
      return { ok: false, reason: 'PROPOSAL_NOT_FOUND' };
    }
    if (proposalRows[0].proposal_status !== 'SENT') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_SENT' };
    }

    const [proposalUpdate] = await conn.execute(
      `UPDATE proposals
          SET proposal_status = 'RESPONDED',
              client_responded_at = NOW()
        WHERE proposal_id = ?
          AND lead_id = ?
          AND proposal_status = 'SENT'`,
      [normalizedProposalId, normalizedLeadId]
    );
    if (proposalUpdate.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_SENT' };
    }

    await conn.execute(
      `UPDATE leads
          SET current_stage = 'ENGAGEMENT_LETTER',
              stage_progress = 'NOT_CREATED',
              next_action = 'Buat engagement letter',
              due_date = DATE_ADD(NOW(), INTERVAL 1 DAY)
        WHERE lead_id = ?`,
      [normalizedLeadId]
    );

    await insertActivityLog(conn, {
      leadId: normalizedLeadId,
      activityType: LEAD_ACTIVITY_TYPES.PROPOSAL_RESPONDED,
      title: 'Client merespons proposal',
      description: 'Proposal ditandai direspons client dan lead dilanjutkan ke tahap Engagement Letter.',
      createdBy: userId
    });

    await conn.commit();
    const proposal = await fetchProposalDetail(conn, normalizedLeadId, normalizedProposalId);
    return { ok: true, proposal };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

module.exports = {
  fetchLatestProposalForLead,
  createDraftProposal,
  updateDraftProposal,
  deleteDraftProposal,
  submitDraftProposal,
  markProposalSentToClient,
  markProposalResponded
};
