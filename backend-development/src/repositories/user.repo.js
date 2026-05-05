const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const BCRYPT_COST = 10;

/**
 * Repository: SQL query terkait user/role/department.
 * Semua query parameterized — JANGAN concat string ke SQL.
 */

const buildUserShape = (row, departments) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  isActive: !!row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  role: { id: row.role_id, code: row.role_code, name: row.role_name },
  departments
});

const fetchDepartments = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT d.id, d.code, d.name, ud.is_primary
       FROM user_departments ud
       JOIN departments d ON d.id = ud.department_id
      WHERE ud.user_id = ?
      ORDER BY ud.is_primary DESC, d.name`,
    [userId]
  );
  return rows.map((d) => ({ id: d.id, code: d.code, name: d.name, isPrimary: !!d.is_primary }));
};

const findByEmail = async (email) => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.email, u.name, u.password_hash, u.is_active, u.created_at, u.updated_at,
            r.id AS role_id, r.code AS role_code, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
      WHERE u.email = ?
      LIMIT 1`,
    [email]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  const departments = await fetchDepartments(row.id);
  return { ...buildUserShape(row, departments), passwordHash: row.password_hash };
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.email, u.name, u.is_active, u.created_at, u.updated_at,
            r.id AS role_id, r.code AS role_code, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
      LIMIT 1`,
    [id]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  const departments = await fetchDepartments(row.id);
  return buildUserShape(row, departments);
};

const listAll = async ({ search = '', roleCode = null } = {}) => {
  const where = [];
  const params = [];
  if (search && search.trim()) {
    where.push('(u.email LIKE ? OR u.name LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }
  if (roleCode) {
    where.push('r.code = ?');
    params.push(roleCode);
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.name, u.is_active, u.created_at, u.updated_at,
            r.id AS role_id, r.code AS role_code, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       ${whereSql}
      ORDER BY u.email`,
    params
  );
  // Batch ambil departments per user — N+1 saat ini OK untuk 24 user.
  // Optimasi: GROUP_CONCAT atau JOIN khusus bisa nanti kalau scale.
  const result = [];
  for (const row of rows) {
    const departments = await fetchDepartments(row.id);
    result.push(buildUserShape(row, departments));
  }
  return result;
};

/**
 * Validasi internal — pastikan email unique (kecuali untuk user dengan id sama).
 */
const isEmailTaken = async (email, excludeUserId = null) => {
  const [rows] = excludeUserId
    ? await pool.execute('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [email, excludeUserId])
    : await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  return rows.length > 0;
};

/**
 * Hitung jumlah Superadmin aktif — dipakai untuk safety: tidak boleh
 * delete / demote Superadmin terakhir.
 */
const countSuperadmins = async () => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt
       FROM users u
       JOIN roles r ON r.id = u.role_id
      WHERE r.code = 'SUPERADMIN' AND u.is_active = 1`
  );
  return rows[0].cnt;
};

/**
 * Create user + assign departments dalam satu transaction.
 *
 * @param {object} input
 * @param {string} input.email
 * @param {string} input.name
 * @param {string} input.password    plain — akan di-hash di sini
 * @param {number} input.roleId
 * @param {Array<number>} input.departmentIds  primary di index 0
 */
const createWithDepartments = async (input) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
    const [result] = await conn.execute(
      `INSERT INTO users (email, name, password_hash, role_id, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [input.email, input.name, passwordHash, input.roleId]
    );
    const userId = result.insertId;
    for (let i = 0; i < input.departmentIds.length; i++) {
      const deptId = input.departmentIds[i];
      await conn.execute(
        `INSERT INTO user_departments (user_id, department_id, is_primary)
         VALUES (?, ?, ?)`,
        [userId, deptId, i === 0 ? 1 : 0]
      );
    }
    await conn.commit();
    return userId;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

/**
 * Update user core fields + optionally re-assign departments.
 * Kalau `departmentIds` undefined, mapping department tidak diubah.
 * Kalau `departmentIds` array (boleh kosong), mapping di-replace.
 */
const updateWithDepartments = async (userId, patch) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const fields = [];
    const params = [];
    if (patch.email !== undefined) { fields.push('email = ?'); params.push(patch.email); }
    if (patch.name !== undefined)  { fields.push('name = ?');  params.push(patch.name); }
    if (patch.roleId !== undefined){ fields.push('role_id = ?'); params.push(patch.roleId); }
    if (patch.isActive !== undefined) { fields.push('is_active = ?'); params.push(patch.isActive ? 1 : 0); }
    if (fields.length > 0) {
      params.push(userId);
      await conn.execute(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        params
      );
    }

    if (Array.isArray(patch.departmentIds)) {
      await conn.execute('DELETE FROM user_departments WHERE user_id = ?', [userId]);
      for (let i = 0; i < patch.departmentIds.length; i++) {
        const deptId = patch.departmentIds[i];
        await conn.execute(
          `INSERT INTO user_departments (user_id, department_id, is_primary)
           VALUES (?, ?, ?)`,
          [userId, deptId, i === 0 ? 1 : 0]
        );
      }
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const updatePassword = async (userId, newPlainPassword) => {
  const passwordHash = await bcrypt.hash(newPlainPassword, BCRYPT_COST);
  await pool.execute(
    `UPDATE users SET password_hash = ? WHERE id = ?`,
    [passwordHash, userId]
  );
};

const deleteById = async (userId) => {
  // user_departments cascades via FK ON DELETE CASCADE
  await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
};

const logLoginAttempt = async ({ userId, emailTried, ip, userAgent, success }) => {
  try {
    await pool.execute(
      `INSERT INTO login_logs (user_id, email_tried, ip, user_agent, success)
       VALUES (?, ?, ?, ?, ?)`,
      [userId ?? null, emailTried, ip ?? null, userAgent ?? null, success ? 1 : 0]
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[user.repo] logLoginAttempt failed:', e.message);
  }
};

module.exports = {
  findByEmail,
  findById,
  listAll,
  isEmailTaken,
  countSuperadmins,
  createWithDepartments,
  updateWithDepartments,
  updatePassword,
  deleteById,
  logLoginAttempt
};
