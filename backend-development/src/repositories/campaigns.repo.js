const { pool } = require('../config/db');
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
  created_by_name: row.created_by_name
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
    u.name AS created_by_name
  FROM campaigns c
  INNER JOIN campaign_types ct ON ct.campaign_type_id = c.campaign_type_id
  INNER JOIN topics t ON t.topic_id = c.topic_id
  INNER JOIN users u ON u.id = c.created_by
`;

const listAllWithJoins = async () => {
  const [rows] = await pool.query(`${baseSelect} ORDER BY c.created_at DESC`);
  return rows.map(mapCampaignRow);
};

const findByIdWithJoins = async (campaignId) => {
  const [rows] = await pool.execute(`${baseSelect} WHERE c.campaign_id = ? LIMIT 1`, [campaignId]);
  return rows.length === 0 ? null : mapCampaignRow(rows[0]);
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
  findByIdWithJoins,
  create,
  update,
  setArchived
};
