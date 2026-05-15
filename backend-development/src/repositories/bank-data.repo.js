const { pool } = require('../config/db');
const { formatLeadSourceLabel } = require('../utils/lead-source-label');
const { formatAnswerDisplayValue } = require('../utils/submission-summary');
const { LEAD_ACTIVITY_TYPES } = require('../constants/lead-activity-types');

/** Konversi DATETIME/Date MySQL ke ISO string untuk JSON (hindari serialize tidak konsisten). */
const formatHandledInstant = (v) => {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const normalizeBankDataStatus = (raw) => String(raw ?? '').trim().toUpperCase();

const BANK_DATA_LIST_SELECT = `
  SELECT
      l.lead_id,
      COALESCE(fs.submitted_at, l.created_at) AS submitted_at,
      l.company_name,
      l.pic_name,
      l.email,
      l.phone_number,
      l.bank_data_status,
      l.processed_by,
      l.processed_at,
      l.bank_data_archived_by,
      l.bank_data_archived_at,
      c.name AS campaign_name,
      f.title AS form_title,
      fdl.link_type,
      ch.code AS channel_code,
      ch.name AS channel_name,
      up.name AS processed_by_name,
      ua.name AS bank_data_archived_by_name
    FROM leads l
    LEFT JOIN campaigns c ON c.campaign_id = l.campaign_id
    LEFT JOIN forms f ON f.form_id = l.form_id
    LEFT JOIN form_distribution_links fdl ON fdl.distribution_link_id = l.distribution_link_id
    LEFT JOIN form_channels ch ON ch.channel_id = fdl.channel_id
    LEFT JOIN form_submissions fs ON fs.submission_id = l.submission_id
    LEFT JOIN users up ON up.id = l.processed_by
    LEFT JOIN users ua ON ua.id = l.bank_data_archived_by
   WHERE l.source_type = 'FORM_LEAD_CAPTURE'
`;

const mapHandledFields = (row) => {
  const status = normalizeBankDataStatus(row.bank_data_status);
  if (status === 'PROCESSED') {
    const uid = row.processed_by != null ? Number(row.processed_by) : null;
    return {
      handled_by_user_id: uid != null && Number.isInteger(uid) && uid > 0 ? uid : null,
      handled_by_name: row.processed_by_name ?? null,
      handled_at: formatHandledInstant(row.processed_at)
    };
  }
  if (status === 'ARCHIVED') {
    const uid = row.bank_data_archived_by != null ? Number(row.bank_data_archived_by) : null;
    return {
      handled_by_user_id: uid != null && Number.isInteger(uid) && uid > 0 ? uid : null,
      handled_by_name: row.bank_data_archived_by_name ?? null,
      handled_at: formatHandledInstant(row.bank_data_archived_at)
    };
  }
  return { handled_by_user_id: null, handled_by_name: null, handled_at: null };
};

const mapListRow = (row) => {
  const handled = mapHandledFields(row);
  return {
    lead_id: row.lead_id,
    submitted_at: row.submitted_at,
    company_name: row.company_name,
    contact_name: row.pic_name,
    contact_email: row.email,
    contact_phone: row.phone_number,
    source_label: formatLeadSourceLabel(row.link_type, row.channel_code, row.channel_name),
    campaign_name: row.campaign_name ?? null,
    form_title: row.form_title ?? null,
    bank_data_status: row.bank_data_status,
    handled_by_user_id: handled.handled_by_user_id,
    handled_by_name: handled.handled_by_name,
    handled_at: handled.handled_at
  };
};

const listFormLeadCapture = async () => {
  const [rows] = await pool.execute(
    `${BANK_DATA_LIST_SELECT}
     ORDER BY COALESCE(fs.submitted_at, l.created_at) DESC, l.lead_id DESC`
  );
  return rows.map(mapListRow);
};

const fetchExtraAnswers = async (submissionId) => {
  if (!submissionId) return [];
  const [rows] = await pool.execute(
    `SELECT
        f.field_id,
        f.field_key,
        f.label,
        f.field_type,
        f.sort_order,
        a.answer_value,
        a.answer_file_path
      FROM form_submission_answers a
      INNER JOIN form_fields f ON f.field_id = a.field_id
     WHERE a.submission_id = ?
       AND f.is_system = 0
     ORDER BY f.sort_order ASC, f.field_id ASC`,
    [submissionId]
  );
  if (rows.length === 0) return [];
  const fieldIds = rows.map((r) => r.field_id);
  const placeholders = fieldIds.map(() => '?').join(',');
  const [options] = await pool.execute(
    `SELECT field_id, label, value
       FROM form_field_options
      WHERE field_id IN (${placeholders})`,
    fieldIds
  );
  const optionsByField = new Map();
  for (const o of options) {
    const list = optionsByField.get(o.field_id) || [];
    list.push({ label: o.label, value: o.value });
    optionsByField.set(o.field_id, list);
  }
  return rows.map((row) => ({
    field_id: row.field_id,
    field_key: row.field_key,
    label: row.label,
    field_type: row.field_type,
    sort_order: row.sort_order,
    answer_value: row.answer_value,
    answer_display_value: formatAnswerDisplayValue(
      row.field_type,
      row.answer_value,
      optionsByField.get(row.field_id) || []
    ),
    answer_file_path: row.answer_file_path
  }));
};

const findFormLeadCaptureDetail = async (leadId) => {
  const [rows] = await pool.execute(
    `${BANK_DATA_LIST_SELECT}
       AND l.lead_id = ?
     LIMIT 1`,
    [leadId]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  const [leadRows] = await pool.execute(
    `SELECT company_address, desired_services, submission_id
       FROM leads
      WHERE lead_id = ?
      LIMIT 1`,
    [leadId]
  );
  const extra = leadRows[0] || {};
  const extraAnswers = await fetchExtraAnswers(extra.submission_id);
  const handled = mapHandledFields(row);
  return {
    ...mapListRow(row),
    company_address: extra.company_address ?? null,
    desired_services: extra.desired_services ?? null,
    extra_answers: extraAnswers
  };
};

const insertActivityLog = async (conn, { leadId, activityType, title, description, createdBy }) => {
  await conn.execute(
    `INSERT INTO lead_activity_logs (lead_id, activity_type, title, description, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [leadId, activityType, title, description, createdBy]
  );
};

const processLead = async (leadId, userId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      `UPDATE leads
          SET bank_data_status = 'PROCESSED',
              processed_by = ?,
              processed_at = NOW(),
              bank_data_archived_by = NULL,
              bank_data_archived_at = NULL,
              lead_status = 'ACTIVE',
              current_stage = 'MEETING',
              stage_progress = 'NOT_SCHEDULED',
              next_action = 'Jadwalkan meeting',
              due_date = DATE_ADD(NOW(), INTERVAL 1 DAY)
        WHERE lead_id = ?
          AND source_type = 'FORM_LEAD_CAPTURE'
          AND bank_data_status = 'NEW'`,
      [userId, leadId]
    );
    if (result.affectedRows === 0) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_NEW' };
    }
    await insertActivityLog(conn, {
      leadId,
      activityType: LEAD_ACTIVITY_TYPES.BANK_DATA_PROCESSED,
      title: 'Lead diproses dari Bank Data',
      description: 'Lead dipindahkan ke Lead Tracker dan tahap awal diset ke Meeting.',
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

const archiveLead = async (leadId, userId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      `UPDATE leads
          SET bank_data_status = 'ARCHIVED',
              bank_data_archived_by = ?,
              bank_data_archived_at = NOW(),
              processed_by = NULL,
              processed_at = NULL,
              lead_status = NULL,
              current_stage = NULL,
              stage_progress = NULL,
              next_action = NULL,
              due_date = NULL
        WHERE lead_id = ?
          AND source_type = 'FORM_LEAD_CAPTURE'
          AND bank_data_status = 'NEW'`,
      [userId, leadId]
    );
    if (result.affectedRows === 0) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_NEW' };
    }
    await insertActivityLog(conn, {
      leadId,
      activityType: LEAD_ACTIVITY_TYPES.BANK_DATA_ARCHIVED,
      title: 'Lead diarsipkan dari Bank Data',
      description: 'Lead tidak dilanjutkan ke Lead Tracker.',
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
  listFormLeadCapture,
  findFormLeadCaptureDetail,
  processLead,
  archiveLead
};
