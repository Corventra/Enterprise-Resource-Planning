const { pool } = require('../config/db');
const { LEAD_ACTIVITY_TYPES } = require('../constants/lead-activity-types');
const {
  buildEngagementWorkspaceItem,
  fetchLeadSummaryByLeadId,
  engagementBaseSelect,
  normalizeEngagementId
} = require('./lead-workspace-engagements.repo');

const insertActivityLog = async (conn, { leadId, activityType, title, description, createdBy }) => {
  await conn.execute(
    `INSERT INTO lead_activity_logs (lead_id, activity_type, title, description, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [leadId, activityType, title, description, createdBy]
  );
};

const fetchPendingEngagementApproval = async (conn, engagementId) => {
  const [rows] = await conn.execute(
    `SELECT approval_id, proposal_id, engagement_id, sequence_no, decision, note, decided_at, created_at
       FROM approvals
      WHERE engagement_id = ?
        AND approval_role = 'CEO'
        AND decision = 'PENDING'
      ORDER BY approval_id DESC
      LIMIT 1`,
    [engagementId]
  );
  return rows[0] ?? null;
};

const listPendingEngagementLetters = async () => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT
          a.approval_id,
          e.engagement_id,
          e.engagement_code,
          e.lead_id,
          l.company_name,
          e.issuer_company,
          e.payment_method,
          e.engagement_status,
          e.agreed_fee,
          us.name AS submitted_by_name,
          e.submitted_at,
          s.name AS service_name
        FROM approvals a
        INNER JOIN engagement_letters e ON e.engagement_id = a.engagement_id
        INNER JOIN leads l ON l.lead_id = e.lead_id
        INNER JOIN proposals p ON p.proposal_id = e.proposal_id
        INNER JOIN services s ON s.service_id = p.service_id
        LEFT JOIN users us ON us.id = e.submitted_by
       WHERE a.decision = 'PENDING'
         AND a.approval_role = 'CEO'
         AND a.engagement_id IS NOT NULL
         AND e.engagement_status = 'WAITING_CEO_APPROVAL'
       ORDER BY e.submitted_at DESC, e.engagement_id DESC`
    );

    const items = rows.map((r) => ({
      approval_id: r.approval_id,
      engagement_id: r.engagement_id,
      engagement_code: r.engagement_code ?? null,
      lead_id: r.lead_id,
      company_name: r.company_name ?? null,
      issuer_company: r.issuer_company,
      payment_method: r.payment_method,
      engagement_status: r.engagement_status,
      agreed_fee: r.agreed_fee != null ? Number(r.agreed_fee) : null,
      submitted_by_name: r.submitted_by_name ?? null,
      submitted_at: r.submitted_at ?? null,
      service_name: r.service_name ?? null
    }));

    return { ok: true, items };
  } finally {
    conn.release();
  }
};

const getPendingEngagementLetterDetail = async (engagementIdRaw) => {
  const engagementId = normalizeEngagementId(engagementIdRaw);
  if (engagementId == null) {
    return { ok: false, reason: 'INVALID_ENGAGEMENT_ID' };
  }

  const conn = await pool.getConnection();
  try {
    const [approvalRows] = await conn.execute(
      `SELECT
          approval_id,
          proposal_id,
          engagement_id,
          sequence_no,
          decision,
          note,
          decided_at,
          created_at
        FROM approvals
       WHERE engagement_id = ?
         AND decision = 'PENDING'
         AND approval_role = 'CEO'
       LIMIT 1`,
      [engagementId]
    );

    if (!approvalRows[0]) {
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const approval = {
      approval_id: approvalRows[0].approval_id,
      proposal_id: approvalRows[0].proposal_id,
      engagement_id: approvalRows[0].engagement_id,
      sequence_no: approvalRows[0].sequence_no,
      decision: approvalRows[0].decision,
      note: approvalRows[0].note ?? null,
      decided_at: approvalRows[0].decided_at ?? null,
      created_at: approvalRows[0].created_at
    };

    const [engRows] = await conn.execute(`${engagementBaseSelect} WHERE e.engagement_id = ? LIMIT 1`, [engagementId]);
    if (!engRows[0]) {
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (engRows[0].engagement_status !== 'WAITING_CEO_APPROVAL') {
      return { ok: false, reason: 'NOT_PENDING' };
    }

    const leadId = engRows[0].lead_id;
    const [lead_summary, item] = await Promise.all([
      fetchLeadSummaryByLeadId(conn, leadId),
      buildEngagementWorkspaceItem(conn, engRows[0])
    ]);

    return { ok: true, data: { approval, lead_summary, item } };
  } finally {
    conn.release();
  }
};

const approveEngagementLetter = async (engagementIdRaw, userId) => {
  const engagementId = normalizeEngagementId(engagementIdRaw);
  if (engagementId == null) {
    return { ok: false, reason: 'INVALID_ENGAGEMENT_ID' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [engRows] = await conn.execute(
      `SELECT engagement_id, lead_id, engagement_status
         FROM engagement_letters
        WHERE engagement_id = ?
        FOR UPDATE`,
      [engagementId]
    );
    const eng = engRows[0];
    if (!eng) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (eng.engagement_status !== 'WAITING_CEO_APPROVAL') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_PENDING' };
    }

    const approval = await fetchPendingEngagementApproval(conn, engagementId);
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

    const [elUpdate] = await conn.execute(
      `UPDATE engagement_letters
          SET engagement_status = 'APPROVED',
              approved_by = ?,
              approved_at = NOW()
        WHERE engagement_id = ?
          AND engagement_status = 'WAITING_CEO_APPROVAL'`,
      [userId, engagementId]
    );
    if (elUpdate.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_PENDING' };
    }

    await conn.execute(
      `UPDATE leads
          SET current_stage = 'ENGAGEMENT_LETTER',
              stage_progress = 'APPROVED',
              next_action = 'Kirim engagement letter ke client',
              due_date = DATE_ADD(NOW(), INTERVAL 1 DAY)
        WHERE lead_id = ?`,
      [eng.lead_id]
    );

    await insertActivityLog(conn, {
      leadId: eng.lead_id,
      activityType: LEAD_ACTIVITY_TYPES.ENGAGEMENT_LETTER_APPROVED,
      title: 'Engagement letter disetujui CEO',
      description: 'Engagement letter disetujui CEO dan siap dikirim ke client.',
      createdBy: userId
    });

    await conn.commit();
    return { ok: true };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const rejectEngagementLetter = async (engagementIdRaw, note, userId) => {
  const engagementId = normalizeEngagementId(engagementIdRaw);
  if (engagementId == null) {
    return { ok: false, reason: 'INVALID_ENGAGEMENT_ID' };
  }

  const trimmedNote = typeof note === 'string' ? note.trim() : '';
  if (!trimmedNote) {
    return { ok: false, reason: 'NOTE_REQUIRED' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [engRows] = await conn.execute(
      `SELECT engagement_id, lead_id, engagement_status
         FROM engagement_letters
        WHERE engagement_id = ?
        FOR UPDATE`,
      [engagementId]
    );
    const eng = engRows[0];
    if (!eng) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (eng.engagement_status !== 'WAITING_CEO_APPROVAL') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_PENDING' };
    }

    const approval = await fetchPendingEngagementApproval(conn, engagementId);
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

    const [elUpdate] = await conn.execute(
      `UPDATE engagement_letters
          SET engagement_status = 'NEED_REVISION',
              revision_note = ?
        WHERE engagement_id = ?
          AND engagement_status = 'WAITING_CEO_APPROVAL'`,
      [trimmedNote, engagementId]
    );
    if (elUpdate.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_PENDING' };
    }

    await conn.execute(
      `UPDATE leads
          SET current_stage = 'ENGAGEMENT_LETTER',
              stage_progress = 'REVISION',
              next_action = 'Revisi engagement letter',
              due_date = DATE_ADD(NOW(), INTERVAL 1 DAY)
        WHERE lead_id = ?`,
      [eng.lead_id]
    );

    await insertActivityLog(conn, {
      leadId: eng.lead_id,
      activityType: LEAD_ACTIVITY_TYPES.ENGAGEMENT_LETTER_REVISION_REQUESTED,
      title: 'CEO meminta revisi engagement letter',
      description: trimmedNote,
      createdBy: userId
    });

    await conn.commit();
    return { ok: true };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

module.exports = {
  listPendingEngagementLetters,
  getPendingEngagementLetterDetail,
  approveEngagementLetter,
  rejectEngagementLetter
};
