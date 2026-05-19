const roleRepo = require('../repositories/role.repo');
const deptRepo = require('../repositories/department.repo');
const { pool } = require('../config/db');

/**
 * Endpoint dropdown data — dipanggil frontend untuk populate UI form.
 * Tidak butuh permission khusus — siapa saja yang sudah login boleh akses.
 */

const listRoles = async (_req, res) => {
  try {
    const roles = await roleRepo.listAll();
    return res.json({ roles });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[lookup] listRoles error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const listDepartments = async (req, res) => {
  try {
    const activeOnly = req.query.activeOnly === '1' || req.query.activeOnly === 'true';
    const departments = await deptRepo.listAll({ activeOnly });
    return res.json({ departments });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[lookup] listDepartments error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/lookup/users?role=PM[&departmentId=N]
 * Return list user aktif yang memiliki role tertentu. Optional filter
 * `departmentId` — hanya kembalikan user yang punya entry di user_departments
 * untuk department tersebut.
 * Output: { users: [{ id, name, email, role_code }] }
 */
const listUsersByRole = async (req, res) => {
  try {
    const roleCode = String(req.query.role || '').trim().toUpperCase();
    if (!roleCode) {
      return res.status(400).json({ error: 'Query param `role` wajib diisi.' });
    }
    const departmentIdRaw = req.query.departmentId;
    const departmentId = departmentIdRaw ? Number(departmentIdRaw) : null;
    if (departmentIdRaw && (!Number.isInteger(departmentId) || departmentId <= 0)) {
      return res.status(400).json({ error: 'Query param `departmentId` harus integer positif.' });
    }

    let sql = `SELECT DISTINCT u.id, u.name, u.email, r.code AS role_code
               FROM users u
               INNER JOIN roles r ON r.id = u.role_id`;
    const params = [];
    if (departmentId) {
      sql += ` INNER JOIN user_departments ud ON ud.user_id = u.id AND ud.department_id = ?`;
      params.push(departmentId);
    }
    sql += ` WHERE r.code = ? AND u.is_active = 1 ORDER BY u.name ASC`;
    params.push(roleCode);

    const [rows] = await pool.query(sql, params);
    return res.json({ users: rows });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[lookup] listUsersByRole error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { listRoles, listDepartments, listUsersByRole };
