const { pool } = require('../config/db');

/**
 * Repository: query terkait permissions + role_permissions.
 */

const listAll = async () => {
  const [rows] = await pool.query(
    `SELECT id, code, description FROM permissions ORDER BY code`
  );
  return rows.map((r) => ({ id: r.id, code: r.code, description: r.description }));
};

/**
 * Ambil daftar permission code yang dimiliki suatu role.
 * Return array of strings — sengaja flat supaya gampang dimasukkan ke JWT payload.
 */
const listCodesByRoleId = async (roleId) => {
  const [rows] = await pool.execute(
    `SELECT p.code
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.code`,
    [roleId]
  );
  return rows.map((r) => r.code);
};

const listCodesByRoleCode = async (roleCode) => {
  const [rows] = await pool.execute(
    `SELECT p.code
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       JOIN roles r ON r.id = rp.role_id
      WHERE r.code = ?
      ORDER BY p.code`,
    [roleCode]
  );
  return rows.map((r) => r.code);
};

module.exports = { listAll, listCodesByRoleId, listCodesByRoleCode };
