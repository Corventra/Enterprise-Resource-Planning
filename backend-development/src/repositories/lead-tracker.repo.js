const { pool } = require('../config/db');
const { LEAD_ACTIVITY_TYPES } = require('../constants/lead-activity-types');
const { generateNextLeadCode } = require('../utils/entity-display-code');

const LOST_REASON_CODES = [
  'NO_RESPONSE',
  'NOT_INTERESTED',
  'BUDGET_ISSUE',
  'LOST_TO_COMPETITOR',
  'TIMING_NOT_RIGHT',
  'NOT_QUALIFIED',
  'INTERNAL_DECISION',
  'OTHER'
];

const LOST_REASON_LABELS = {
  NO_RESPONSE: 'Tidak ada respons',
  NOT_INTERESTED: 'Tidak tertarik',
  BUDGET_ISSUE: 'Masalah anggaran',
  LOST_TO_COMPETITOR: 'Kalah ke kompetitor',
  TIMING_NOT_RIGHT: 'Timing belum tepat',
  NOT_QUALIFIED: 'Tidak qualified',
  INTERNAL_DECISION: 'Keputusan internal',
  OTHER: 'Lainnya'
};

const LEAD_TRACKER_LIST_SELECT = `
  SELECT
      l.lead_id,
      l.lead_code,
      l.company_name,
      l.pic_name,
      l.email,
      l.phone_number,
      l.current_stage,
      l.stage_progress,
      l.next_action,
      l.due_date,
      l.lead_status,
      l.processed_at,
      l.processed_by,
      up.name AS processed_by_name
    FROM leads l
    LEFT JOIN users up ON up.id = l.processed_by
   WHERE l.lead_status IN ('ACTIVE', 'WON', 'LOST')
     AND (
       (l.source_type = 'FORM_LEAD_CAPTURE' AND l.bank_data_status = 'PROCESSED')
       OR l.source_type = 'MANUAL'
     )
`;

const mapListRow = (row) => ({
  lead_id: row.lead_id,
  lead_code: row.lead_code ?? null,
  company_name: row.company_name,
  pic_name: row.pic_name,
  email: row.email,
  phone_number: row.phone_number,
  current_stage: row.current_stage,
  stage_progress: row.stage_progress,
  next_action: row.next_action,
  due_date: row.due_date,
  lead_status: row.lead_status,
  processed_by: row.processed_by ?? null,
  processed_by_name: row.processed_by_name ?? null,
  processed_at: row.processed_at ?? null
});

const listTrackedLeads = async () => {
  const [rows] = await pool.execute(
    `${LEAD_TRACKER_LIST_SELECT}
     ORDER BY COALESCE(l.due_date, l.processed_at, l.created_at) ASC, l.lead_id DESC`
  );
  return rows.map(mapListRow);
};

const findTrackedLeadById = async (leadId) => {
  const [rows] = await pool.execute(
    `${LEAD_TRACKER_LIST_SELECT}
       AND l.lead_id = ?
     LIMIT 1`,
    [leadId]
  );
  if (rows.length === 0) return null;
  return mapListRow(rows[0]);
};

const insertActivityLog = async (conn, { leadId, activityType, title, description, createdBy }) => {
  await conn.execute(
    `INSERT INTO lead_activity_logs (lead_id, activity_type, title, description, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [leadId, activityType, title, description, createdBy]
  );
};

const createManualLead = async (payload, userId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let leadId;
    let insertErr;
    for (let attempt = 0; attempt < 15; attempt++) {
      const leadCode = await generateNextLeadCode(conn);
      try {
        const [result] = await conn.execute(
          `INSERT INTO leads (
          lead_code,
          source_type,
          company_name,
          company_address,
          pic_name,
          email,
          phone_number,
          desired_services,
          bank_data_status,
          lead_status,
          current_stage,
          stage_progress,
          next_action,
          due_date,
          processed_by,
          processed_at
        ) VALUES (
          ?,
          'MANUAL',
          ?, ?, ?, ?, ?, ?,
          NULL,
          'ACTIVE',
          'MEETING',
          'NOT_SCHEDULED',
          'Jadwalkan meeting',
          DATE_ADD(NOW(), INTERVAL 1 DAY),
          ?,
          NOW()
        )`,
          [
            leadCode,
            payload.company_name,
            payload.company_address,
            payload.pic_name,
            payload.email,
            payload.phone_number,
            payload.desired_services,
            userId
          ]
        );
        leadId = result.insertId;
        insertErr = undefined;
        break;
      } catch (e) {
        insertErr = e;
        if (e.code === 'ER_DUP_ENTRY') {
          continue;
        }
        throw e;
      }
    }
    if (insertErr && leadId == null) {
      throw insertErr;
    }
    await insertActivityLog(conn, {
      leadId,
      activityType: LEAD_ACTIVITY_TYPES.LEAD_CREATED_MANUAL,
      title: 'Lead manual dibuat',
      description: 'Lead ditambahkan langsung ke Lead Tracker.',
      createdBy: userId
    });
    await conn.commit();
    return findTrackedLeadById(leadId);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const markLeadLost = async (leadId, payload, userId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      `UPDATE leads
          SET lead_status = 'LOST',
              lost_reason_code = ?,
              lost_reason_note = ?,
              lost_at = NOW(),
              next_action = NULL,
              due_date = NULL
        WHERE lead_id = ?
          AND lead_status = 'ACTIVE'
          AND (
            (source_type = 'FORM_LEAD_CAPTURE' AND bank_data_status = 'PROCESSED')
            OR source_type = 'MANUAL'
          )`,
      [payload.lost_reason_code, payload.lost_reason_note, leadId]
    );
    if (result.affectedRows === 0) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_ACTIVE' };
    }
    const reasonLabel = LOST_REASON_LABELS[payload.lost_reason_code] || payload.lost_reason_code;
    const description = payload.lost_reason_note
      ? `Alasan: ${reasonLabel}. ${payload.lost_reason_note}`
      : `Alasan: ${reasonLabel}.`;
    await insertActivityLog(conn, {
      leadId,
      activityType: LEAD_ACTIVITY_TYPES.LEAD_LOST,
      title: 'Lead ditandai sebagai lost',
      description,
      createdBy: userId
    });
    await conn.commit();
    const entry = await findTrackedLeadById(leadId);
    return { ok: true, entry };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

module.exports = {
  LOST_REASON_CODES,
  LOST_REASON_LABELS,
  listTrackedLeads,
  findTrackedLeadById,
  createManualLead,
  markLeadLost
};
