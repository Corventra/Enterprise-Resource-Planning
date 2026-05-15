const { pool } = require('../config/db');
const { normalizeHandoverId, buildHandoverDetailPayload } = require('./handover.repo');
const { fetchLeadSummaryByLeadId } = require('./lead-workspace-engagements.repo');

const fetchPendingHandoverApproval = async (conn, handoverId) => {
  const [rows] = await conn.execute(
    `SELECT approval_id, handover_id, sequence_no, decision, note, decided_at, created_at
       FROM approvals
      WHERE handover_id = ?
        AND approval_role = 'CEO'
        AND decision = 'PENDING'
      ORDER BY approval_id DESC
      LIMIT 1`,
    [handoverId]
  );
  return rows[0] ?? null;
};

const listPendingHandovers = async () => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT
          a.approval_id,
          h.handover_id,
          h.handover_code,
          h.lead_id,
          h.status AS handover_status,
          h.project_title,
          h.submitted_at,
          l.company_name,
          s.name AS service_name,
          us.name AS submitted_by_name
        FROM approvals a
        INNER JOIN handovers h ON h.handover_id = a.handover_id
        INNER JOIN leads l ON l.lead_id = h.lead_id
        INNER JOIN services s ON s.service_id = h.service_id
        LEFT JOIN users us ON us.id = h.submitted_by
       WHERE a.decision = 'PENDING'
         AND a.approval_role = 'CEO'
         AND a.handover_id IS NOT NULL
         AND h.status = 'WAITING_CEO_APPROVAL'
       ORDER BY h.submitted_at DESC, h.handover_id DESC`
    );

    const items = rows.map((r) => ({
      approval_id: r.approval_id,
      handover_id: r.handover_id,
      handover_code: r.handover_code,
      lead_id: r.lead_id,
      handover_status: r.handover_status,
      company_name: r.company_name ?? null,
      project_title: r.project_title ?? null,
      service_name: r.service_name ?? null,
      submitted_by_name: r.submitted_by_name ?? null,
      submitted_at: r.submitted_at ?? null
    }));

    return { ok: true, items };
  } finally {
    conn.release();
  }
};

const getPendingHandoverApprovalDetail = async (handoverIdRaw) => {
  const handoverId = normalizeHandoverId(handoverIdRaw);
  if (handoverId == null) {
    return { ok: false, reason: 'INVALID_HANDOVER_ID' };
  }

  const conn = await pool.getConnection();
  try {
    const [hRows] = await conn.execute(
      `SELECT handover_id, lead_id, status, ceo_revision_note
         FROM handovers
        WHERE handover_id = ?`,
      [handoverId]
    );
    const handoverRow = hRows[0];
    if (!handoverRow) {
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (handoverRow.status !== 'WAITING_CEO_APPROVAL') {
      return { ok: false, reason: 'NOT_PENDING' };
    }

    const approvalRow = await fetchPendingHandoverApproval(conn, handoverId);
    if (!approvalRow) {
      return { ok: false, reason: 'APPROVAL_NOT_FOUND' };
    }

    const approval = {
      approval_id: approvalRow.approval_id,
      handover_id: approvalRow.handover_id,
      sequence_no: approvalRow.sequence_no,
      decision: approvalRow.decision,
      note: approvalRow.note ?? null,
      decided_at: approvalRow.decided_at ?? null,
      created_at: approvalRow.created_at
    };

    const [handover, lead_summary] = await Promise.all([
      buildHandoverDetailPayload(handoverId),
      fetchLeadSummaryByLeadId(conn, handoverRow.lead_id)
    ]);

    if (!handover) {
      return { ok: false, reason: 'NOT_FOUND' };
    }

    return {
      ok: true,
      data: {
        approval,
        lead_summary,
        handover,
        ceo_revision_note: handoverRow.ceo_revision_note ?? null
      }
    };
  } finally {
    conn.release();
  }
};

const approveHandover = async (handoverIdRaw, userId) => {
  const handoverId = normalizeHandoverId(handoverIdRaw);
  if (handoverId == null) {
    return { ok: false, reason: 'INVALID_HANDOVER_ID' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [hRows] = await conn.execute(
      `SELECT handover_id, handover_code, status
         FROM handovers
        WHERE handover_id = ?
        FOR UPDATE`,
      [handoverId]
    );
    const handover = hRows[0];
    if (!handover) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (handover.status !== 'WAITING_CEO_APPROVAL') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_PENDING' };
    }

    const approval = await fetchPendingHandoverApproval(conn, handoverId);
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

    const [handoverUpdate] = await conn.execute(
      `UPDATE handovers
          SET status = 'APPROVED',
              approved_by = ?,
              approved_at = NOW()
        WHERE handover_id = ?
          AND status = 'WAITING_CEO_APPROVAL'`,
      [userId, handoverId]
    );
    if (handoverUpdate.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_PENDING' };
    }

    await conn.execute(
      `INSERT INTO handover_activity_logs (handover_id, activity_type, title, description, created_by)
       VALUES (?, 'HANDOVER_APPROVED', ?, ?, ?)`,
      [
        handoverId,
        'Handover disetujui CEO',
        `Memo handover ${handover.handover_code} disetujui CEO dan siap diteruskan ke proses berikutnya.`,
        userId
      ]
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

const rejectHandover = async (handoverIdRaw, note, userId) => {
  const handoverId = normalizeHandoverId(handoverIdRaw);
  if (handoverId == null) {
    return { ok: false, reason: 'INVALID_HANDOVER_ID' };
  }

  const trimmedNote = typeof note === 'string' ? note.trim() : '';
  if (!trimmedNote) {
    return { ok: false, reason: 'NOTE_REQUIRED' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [hRows] = await conn.execute(
      `SELECT handover_id, handover_code, status
         FROM handovers
        WHERE handover_id = ?
        FOR UPDATE`,
      [handoverId]
    );
    const handover = hRows[0];
    if (!handover) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    if (handover.status !== 'WAITING_CEO_APPROVAL') {
      await conn.rollback();
      return { ok: false, reason: 'NOT_PENDING' };
    }

    const approval = await fetchPendingHandoverApproval(conn, handoverId);
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

    const [handoverUpdate] = await conn.execute(
      `UPDATE handovers
          SET status = 'NEED_REVISION',
              ceo_revision_note = ?
        WHERE handover_id = ?
          AND status = 'WAITING_CEO_APPROVAL'`,
      [trimmedNote, handoverId]
    );
    if (handoverUpdate.affectedRows !== 1) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_PENDING' };
    }

    await conn.execute(
      `INSERT INTO handover_activity_logs (handover_id, activity_type, title, description, created_by)
       VALUES (?, 'HANDOVER_REVISION_REQUESTED', ?, ?, ?)`,
      [
        handoverId,
        'Permintaan revisi handover',
        `CEO meminta revisi pada memo handover ${handover.handover_code}. Catatan: ${trimmedNote}`,
        userId
      ]
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

module.exports = {
  listPendingHandovers,
  getPendingHandoverApprovalDetail,
  approveHandover,
  rejectHandover
};
