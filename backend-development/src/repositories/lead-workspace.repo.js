const { pool } = require('../config/db');
const { formatLeadSourceLabel } = require('../utils/lead-source-label');
const { LEAD_ACTIVITY_TYPES } = require('../constants/lead-activity-types');

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

const LEAD_WORKSPACE_DETAIL_SELECT = `
  SELECT
      l.lead_id,
      l.company_name,
      l.company_address,
      l.pic_name,
      l.email,
      l.phone_number,
      l.desired_services,
      l.source_type,
      l.bank_data_status,
      l.lead_status,
      l.current_stage,
      l.stage_progress,
      l.next_action,
      l.due_date,
      l.processed_at,
      l.processed_by,
      l.updated_at,
      up.name AS processed_by_name,
      c.campaign_id,
      c.name AS campaign_name,
      f.form_id,
      f.title AS form_title,
      l.distribution_link_id,
      fdl.link_type,
      ch.code AS channel_code,
      ch.name AS channel_name
    FROM leads l
    LEFT JOIN users up ON up.id = l.processed_by
    LEFT JOIN campaigns c ON c.campaign_id = l.campaign_id
    LEFT JOIN forms f ON f.form_id = l.form_id
    LEFT JOIN form_distribution_links fdl ON fdl.distribution_link_id = l.distribution_link_id
    LEFT JOIN form_channels ch ON ch.channel_id = fdl.channel_id
   WHERE l.lead_id = ?
     AND l.lead_status IN ('ACTIVE', 'WON', 'LOST')
     AND (
       (l.source_type = 'FORM_LEAD_CAPTURE' AND l.bank_data_status = 'PROCESSED')
       OR l.source_type = 'MANUAL'
     )
`;

const resolveLeadSourceLabel = (row) => {
  if (row.source_type === 'MANUAL') {
    return 'Manual';
  }
  return formatLeadSourceLabel(row.link_type, row.channel_code, row.channel_name);
};

const mapDetailRow = (row) => ({
  lead_id: row.lead_id,
  company_name: row.company_name,
  company_address: row.company_address,
  pic_name: row.pic_name,
  email: row.email,
  phone_number: row.phone_number,
  desired_services: row.desired_services ?? null,
  source_type: row.source_type,
  bank_data_status: row.bank_data_status,
  lead_status: row.lead_status,
  current_stage: row.current_stage,
  stage_progress: row.stage_progress,
  next_action: row.next_action,
  due_date: row.due_date,
  processed_at: row.processed_at ?? null,
  processed_by: row.processed_by ?? null,
  processed_by_name: row.processed_by_name ?? null,
  updated_at: row.updated_at ?? null,
  campaign_id: row.campaign_id ?? null,
  campaign_name: row.campaign_name ?? null,
  form_id: row.form_id ?? null,
  form_title: row.form_title ?? null,
  distribution_link_id: row.distribution_link_id ?? null,
  lead_source_label: resolveLeadSourceLabel(row)
});

const mapActivityLogRow = (row) => ({
  activity_id: row.activity_id,
  activity_type: row.activity_type,
  title: row.title,
  description: row.description ?? null,
  created_at: row.created_at,
  created_by: row.created_by ?? null,
  created_by_name: row.created_by_name ?? null
});

const fetchActivityLogs = async (leadId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  if (normalizedLeadId == null) {
    return [];
  }

  const [rows] = await pool.execute(
    `SELECT
        lal.activity_id,
        lal.activity_type,
        lal.title,
        lal.description,
        lal.created_at,
        lal.created_by,
        u.name AS created_by_name
      FROM lead_activity_logs lal
      LEFT JOIN users u ON u.id = lal.created_by
     WHERE lal.lead_id = ?
     ORDER BY lal.created_at DESC, lal.activity_id DESC
     LIMIT 6`,
    [normalizedLeadId]
  );
  return rows.map(mapActivityLogRow);
};

const findWorkspaceDetail = async (leadId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  if (normalizedLeadId == null) {
    return null;
  }

  const [rows] = await pool.execute(
    `${LEAD_WORKSPACE_DETAIL_SELECT}
     LIMIT 1`,
    [normalizedLeadId]
  );
  if (rows.length === 0) return null;
  const activity_logs = await fetchActivityLogs(normalizedLeadId);
  return {
    ...mapDetailRow(rows[0]),
    activity_logs
  };
};
const insertActivityLog = async (conn, { leadId, activityType, title, description, createdBy }) => {
  await conn.execute(
    `INSERT INTO lead_activity_logs (lead_id, activity_type, title, description, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [leadId, activityType, title, description, createdBy]
  );
};

const updateWorkspaceDetails = async (leadId, payload, userId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  if (normalizedLeadId == null) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      `UPDATE leads
          SET company_name = ?,
              company_address = ?,
              pic_name = ?,
              email = ?,
              phone_number = ?,
              desired_services = ?
        WHERE lead_id = ?
          AND lead_status IN ('ACTIVE', 'WON', 'LOST')
          AND (
            (source_type = 'FORM_LEAD_CAPTURE' AND bank_data_status = 'PROCESSED')
            OR source_type = 'MANUAL'
          )`,
      [
        payload.company_name,
        payload.company_address,
        payload.pic_name,
        payload.email,
        payload.phone_number,
        payload.desired_services,
        normalizedLeadId
      ]
    );
    if (result.affectedRows === 0) {
      await conn.rollback();
      return { ok: false, reason: 'NOT_FOUND' };
    }
    await insertActivityLog(conn, {
      leadId: normalizedLeadId,
      activityType: LEAD_ACTIVITY_TYPES.LEAD_DETAILS_UPDATED,
      title: 'Detail lead diperbarui',
      description: 'Data inti lead diperbarui melalui Lead Workspace.',
      createdBy: userId
    });
    await conn.commit();
    const entry = await findWorkspaceDetail(normalizedLeadId);
    return { ok: true, entry };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const findLeadProcessedBy = async (leadId) => {
  const normalizedLeadId = normalizeLeadId(leadId);
  if (normalizedLeadId == null) {
    return { ok: false, reason: 'INVALID_ID' };
  }

  const [rows] = await pool.execute(
    `SELECT processed_by
       FROM leads
      WHERE lead_id = ?
      LIMIT 1`,
    [normalizedLeadId]
  );

  if (rows.length === 0) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  return {
    ok: true,
    processedBy: rows[0].processed_by ?? null
  };
};

module.exports = {
  findWorkspaceDetail,
  findLeadProcessedBy,
  updateWorkspaceDetails
};
