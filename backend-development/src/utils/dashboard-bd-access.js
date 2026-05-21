const { pool } = require('../config/db');

/** Selaras `departments.code` di DB / seed (`init.sql`). */
const BD_DEPARTMENT_MEO = 'MEO';
const BD_DEPARTMENT_EXECUTIVE = 'EXECUTIVE';

const fetchPrimaryDepartmentCode = async (userId) => {
  if (userId == null) return null;
  const [rows] = await pool.execute(
    `SELECT d.code
       FROM user_departments ud
       INNER JOIN departments d ON d.id = ud.department_id
      WHERE ud.user_id = ?
      ORDER BY ud.is_primary DESC, ud.department_id ASC
      LIMIT 1`,
    [Number(userId)]
  );
  return rows[0]?.code ?? null;
};

/**
 * Variant dashboard BD dari department utama (deterministik).
 * - MEO → marketing (`GET /api/dashboard/meo`)
 * - EXECUTIVE → pipeline (`GET /api/dashboard/bd`)
 * - lainnya → null (403)
 */
const resolveBdDashboardVariantFromDepartment = (primaryCode) => {
  if (primaryCode === BD_DEPARTMENT_MEO) return 'marketing';
  if (primaryCode === BD_DEPARTMENT_EXECUTIVE) return 'pipeline';
  return null;
};

const requireBdDashboardVariant = (variant) => async (req, res, next) => {
  try {
    if (req.user?.role !== 'BD') {
      return res.status(403).json({
        success: false,
        message: 'Akses dashboard BD hanya untuk role Business Development.'
      });
    }

    const primaryCode = await fetchPrimaryDepartmentCode(req.user.sub);
    if (!primaryCode) {
      return res.status(403).json({
        success: false,
        message: 'Department utama user tidak ditemukan.'
      });
    }

    const allowedVariant = resolveBdDashboardVariantFromDepartment(primaryCode);
    if (allowedVariant === null) {
      return res.status(403).json({
        success: false,
        message: `Dashboard tidak tersedia untuk department BD: ${primaryCode}. Hanya MEO (marketing) dan EXECUTIVE (pipeline).`
      });
    }

    if (variant !== allowedVariant) {
      const hint =
        allowedVariant === 'marketing'
          ? 'Gunakan endpoint dashboard marketing (/api/dashboard/meo).'
          : 'Gunakan endpoint dashboard pipeline (/api/dashboard/bd).';
      return res.status(403).json({
        success: false,
        message: `Endpoint ini tidak sesuai department utama (${primaryCode}). ${hint}`
      });
    }

    req.bdDashboardVariant = variant;
    req.bdPrimaryDepartmentCode = primaryCode;
    return next();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[dashboard-bd-access] error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  BD_DEPARTMENT_MEO,
  BD_DEPARTMENT_EXECUTIVE,
  fetchPrimaryDepartmentCode,
  resolveBdDashboardVariantFromDepartment,
  requireBdDashboardVariant
};
