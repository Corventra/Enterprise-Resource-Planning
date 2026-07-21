const { pool } = require('../config/db');
const { deltaPercent } = require('../utils/dashboard-period');
const { formatSqlDate } = require('../utils/sql-date');

const mapTypeRow = (row) => ({
  campaign_type_id: row.campaign_type_id,
  name: row.name,
  code: row.code
});

const mapTopicRow = (row) => ({
  topic_id: row.topic_id,
  name: row.name,
  code: row.code
});

const mapCampaignRow = (row) => ({
  campaign_id: row.campaign_id,
  campaign_code: row.campaign_code,
  name: row.name,
  status: row.status,
  start_date: formatSqlDate(row.start_date),
  end_date: formatSqlDate(row.end_date),
  notes: row.notes,
  image_path: row.image_path,
  created_at: row.created_at,
  updated_at: row.updated_at,
  campaign_type_id: row.campaign_type_id,
  campaign_type_name: row.campaign_type_name,
  campaign_type_code: row.campaign_type_code,
  topic_id: row.topic_id,
  topic_name: row.topic_name,
  topic_code: row.topic_code,
  created_by: row.created_by,
  created_by_name: row.created_by_name,
  total_submissions: Number(row.total_submissions ?? 0)
});

const listActiveTypes = async () => {
  const [rows] = await pool.query(
    `SELECT campaign_type_id, name, code
       FROM campaign_types
      WHERE is_active = 1
      ORDER BY name ASC`
  );
  return rows.map(mapTypeRow);
};

const listActiveTopics = async () => {
  const [rows] = await pool.query(
    `SELECT topic_id, name, code
       FROM topics
      WHERE is_active = 1
      ORDER BY name ASC`
  );
  return rows.map(mapTopicRow);
};

const baseSelect = `
  SELECT
    c.campaign_id,
    c.campaign_code,
    c.name,
    c.status,
    c.start_date,
    c.end_date,
    c.notes,
    c.image_path,
    c.created_at,
    c.updated_at,
    c.campaign_type_id,
    ct.name AS campaign_type_name,
    ct.code AS campaign_type_code,
    c.topic_id,
    t.name AS topic_name,
    t.code AS topic_code,
    c.created_by,
    u.name AS created_by_name,
    (
      SELECT COUNT(*)
        FROM form_submissions fs
        INNER JOIN forms f ON f.form_id = fs.form_id
       WHERE f.campaign_id = c.campaign_id
    ) AS total_submissions
  FROM campaigns c
  INNER JOIN campaign_types ct ON ct.campaign_type_id = c.campaign_type_id
  INNER JOIN topics t ON t.topic_id = c.topic_id
  INNER JOIN users u ON u.id = c.created_by
`;

const listAllWithJoins = async () => {
  const [rows] = await pool.query(`${baseSelect} ORDER BY c.created_at DESC`);
  return rows.map(mapCampaignRow);
};

/** CEO/COO = null (semua user). MEO = campaigns.created_by. */
const buildCreatedByFilter = (userId) => {
  if (userId == null) return { sql: '', params: [] };
  return { sql: ' AND c.created_by = ?', params: [Number(userId)] };
};

const countAllCampaigns = async (userId) => {
  const owner = buildCreatedByFilter(userId);
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt FROM campaigns c WHERE 1=1${owner.sql}`,
    owner.params
  );
  return Number(rows[0]?.cnt ?? 0);
};

const countAllActiveCampaigns = async (userId) => {
  const owner = buildCreatedByFilter(userId);
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt
       FROM campaigns c
      WHERE c.status = 'ACTIVE'
        ${owner.sql}`,
    owner.params
  );
  return Number(rows[0]?.cnt ?? 0);
};

const countSubmissionsInPeriod = async (userId, { startSql, endSqlExclusive }) => {
  const owner = buildCreatedByFilter(userId);
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt
       FROM form_submissions fs
       INNER JOIN forms f ON f.form_id = fs.form_id
       INNER JOIN campaigns c ON c.campaign_id = f.campaign_id
      WHERE fs.submitted_at >= ? AND fs.submitted_at < ?
        ${owner.sql}`,
    [startSql, endSqlExclusive, ...owner.params]
  );
  return Number(rows[0]?.cnt ?? 0);
};

const averagePerCampaign = (submissions, total) => {
  if (total === 0) return 0;
  return Math.round(submissions / total);
};

const fetchPeriodSubmissionMetrics = async (userId, period) => {
  const submissions = await countSubmissionsInPeriod(userId, period);
  const campaignTotal = await countAllCampaigns(userId);
  return {
    submissions,
    average: averagePerCampaign(submissions, campaignTotal)
  };
};

const toSummaryMetric = (value, previous) => ({
  value,
  previous,
  delta: deltaPercent(value, previous)
});

/** Total & active = keseluruhan; submission & average = periode + vs bulan lalu. */
const getCampaignSummary = async (userId, period, comparisonPeriod) => {
  const [total, active, currentPeriod, previousPeriod] = await Promise.all([
    countAllCampaigns(userId),
    countAllActiveCampaigns(userId),
    fetchPeriodSubmissionMetrics(userId, period),
    fetchPeriodSubmissionMetrics(userId, comparisonPeriod)
  ]);

  return {
    total: { value: total },
    active: { value: active },
    total_submissions: toSummaryMetric(currentPeriod.submissions, previousPeriod.submissions),
    average_per_campaign: toSummaryMetric(currentPeriod.average, previousPeriod.average)
  };
};

const findByIdWithJoins = async (campaignId) => {
  const [rows] = await pool.execute(`${baseSelect} WHERE c.campaign_id = ? LIMIT 1`, [campaignId]);
  return rows.length === 0 ? null : mapCampaignRow(rows[0]);
};

/** True if another campaign already uses this start_date (DATE). */
const existsByStartDate = async (startDate, excludeCampaignId = null) => {
  if (excludeCampaignId == null) {
    const [rows] = await pool.execute(
      `SELECT campaign_id FROM campaigns WHERE start_date = ? LIMIT 1`,
      [startDate]
    );
    return rows.length > 0;
  }
  const [rows] = await pool.execute(
    `SELECT campaign_id FROM campaigns WHERE start_date = ? AND campaign_id <> ? LIMIT 1`,
    [startDate, excludeCampaignId]
  );
  return rows.length > 0;
};

const formatCampaignCode = (campaignId) => `cmp-${String(campaignId).padStart(3, '0')}`;

const create = async ({
  campaignTypeId,
  topicId,
  name,
  status,
  startDate,
  endDate,
  notes,
  imagePath,
  createdBy
}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO campaigns (
        campaign_type_id, topic_id, name, status, start_date, end_date, notes, image_path, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        campaignTypeId,
        topicId,
        name,
        status,
        startDate,
        endDate,
        notes,
        imagePath,
        createdBy
      ]
    );
    const campaignId = result.insertId;
    const campaignCode = formatCampaignCode(campaignId);
    await connection.execute(`UPDATE campaigns SET campaign_code = ? WHERE campaign_id = ?`, [
      campaignCode,
      campaignId
    ]);
    await connection.commit();
    return campaignId;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};

const update = async (campaignId, patch) => {
  const fields = [];
  const params = [];
  if (patch.campaignTypeId !== undefined) {
    fields.push('campaign_type_id = ?');
    params.push(patch.campaignTypeId);
  }
  if (patch.topicId !== undefined) {
    fields.push('topic_id = ?');
    params.push(patch.topicId);
  }
  if (patch.name !== undefined) {
    fields.push('name = ?');
    params.push(patch.name);
  }
  if (patch.startDate !== undefined) {
    fields.push('start_date = ?');
    params.push(patch.startDate);
  }
  if (patch.endDate !== undefined) {
    fields.push('end_date = ?');
    params.push(patch.endDate);
  }
  if (patch.notes !== undefined) {
    fields.push('notes = ?');
    params.push(patch.notes);
  }
  if (patch.imagePath !== undefined) {
    fields.push('image_path = ?');
    params.push(patch.imagePath);
  }
  if (fields.length === 0) return;
  params.push(campaignId);
  await pool.execute(`UPDATE campaigns SET ${fields.join(', ')} WHERE campaign_id = ?`, params);
};

const setArchived = async (campaignId) => {
  await pool.execute(`UPDATE campaigns SET status = 'ARCHIVED' WHERE campaign_id = ?`, [campaignId]);
};

module.exports = {
  listActiveTypes,
  listActiveTopics,
  listAllWithJoins,
  getCampaignSummary,
  findByIdWithJoins,
  existsByStartDate,
  create,
  update,
  setArchived
};
