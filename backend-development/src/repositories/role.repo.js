const { pool } = require('../config/db');

const listAll = async () => {
  const [rows] = await pool.query(
    `SELECT id, code, name, is_department_scoped
       FROM roles
      ORDER BY name`
  );
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    isDepartmentScoped: !!r.is_department_scoped
  }));
};

const findByCode = async (code) => {
  const [rows] = await pool.execute(
    `SELECT id, code, name, is_department_scoped
       FROM roles
      WHERE code = ?
      LIMIT 1`,
    [code]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return { id: r.id, code: r.code, name: r.name, isDepartmentScoped: !!r.is_department_scoped };
};

module.exports = { listAll, findByCode };
