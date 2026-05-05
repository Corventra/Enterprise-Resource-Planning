const { pool } = require('../config/db');

const buildShape = (row) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  isActive: !!row.is_active,
  createdAt: row.created_at,
  userCount: typeof row.user_count !== 'undefined' ? Number(row.user_count) : undefined
});

const listAll = async ({ activeOnly = false } = {}) => {
  const sql = activeOnly
    ? `SELECT id, code, name, is_active, created_at FROM departments WHERE is_active = 1 ORDER BY name`
    : `SELECT id, code, name, is_active, created_at FROM departments ORDER BY name`;
  const [rows] = await pool.query(sql);
  return rows.map(buildShape);
};

/**
 * List dengan jumlah user — dipakai admin page (Department Management).
 * LEFT JOIN supaya department dengan 0 user tetap muncul.
 */
const listAllWithUserCount = async () => {
  const [rows] = await pool.query(
    `SELECT d.id, d.code, d.name, d.is_active, d.created_at,
            COUNT(ud.user_id) AS user_count
       FROM departments d
       LEFT JOIN user_departments ud ON ud.department_id = d.id
      GROUP BY d.id, d.code, d.name, d.is_active, d.created_at
      ORDER BY d.name`
  );
  return rows.map(buildShape);
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT id, code, name, is_active, created_at FROM departments WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows.length === 0 ? null : buildShape(rows[0]);
};

const findByCodes = async (codes) => {
  if (!Array.isArray(codes) || codes.length === 0) return [];
  const placeholders = codes.map(() => '?').join(', ');
  const [rows] = await pool.query(
    `SELECT id, code, name, is_active, created_at
       FROM departments
      WHERE code IN (${placeholders})`,
    codes
  );
  return rows.map(buildShape);
};

const isCodeTaken = async (code, excludeId = null) => {
  const [rows] = excludeId
    ? await pool.execute('SELECT id FROM departments WHERE code = ? AND id <> ? LIMIT 1', [code, excludeId])
    : await pool.execute('SELECT id FROM departments WHERE code = ? LIMIT 1', [code]);
  return rows.length > 0;
};

const countUsers = async (deptId) => {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt FROM user_departments WHERE department_id = ?`,
    [deptId]
  );
  return rows[0].cnt;
};

const create = async ({ code, name, isActive = true }) => {
  const [result] = await pool.execute(
    `INSERT INTO departments (code, name, is_active) VALUES (?, ?, ?)`,
    [code, name, isActive ? 1 : 0]
  );
  return result.insertId;
};

const update = async (id, patch) => {
  const fields = [];
  const params = [];
  if (patch.name !== undefined) { fields.push('name = ?'); params.push(patch.name); }
  if (patch.isActive !== undefined) { fields.push('is_active = ?'); params.push(patch.isActive ? 1 : 0); }
  // code immutable — referenced di JWT/permission/serviceLine, rename akan
  // break audit trail. Kalau perlu rename code, hapus + bikin baru manual.
  if (fields.length === 0) return;
  params.push(id);
  await pool.execute(`UPDATE departments SET ${fields.join(', ')} WHERE id = ?`, params);
};

const deleteById = async (id) => {
  await pool.execute('DELETE FROM departments WHERE id = ?', [id]);
};

module.exports = {
  listAll,
  listAllWithUserCount,
  findById,
  findByCodes,
  isCodeTaken,
  countUsers,
  create,
  update,
  deleteById
};
