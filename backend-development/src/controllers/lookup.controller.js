const roleRepo = require('../repositories/role.repo');
const deptRepo = require('../repositories/department.repo');

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

module.exports = { listRoles, listDepartments };
