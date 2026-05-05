/**
 * Middleware factory: terima daftar role code, reject 403 kalau req.user
 * (dari authenticate) tidak ada di daftar. Pakai SETELAH authenticate.
 *
 * Contoh:
 *   router.use(authenticate, requireRole(['SUPERADMIN']));
 *
 * Note: ini Phase 1 — kasar (role-only check). Phase 3 nanti akan diganti
 * dengan permission-based middleware (`requirePermission('USER_MANAGE')`).
 */
const requireRole = (allowedRoles) => {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    throw new Error('requireRole butuh array role code yang non-empty');
  }
  const set = new Set(allowedRoles);
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !set.has(role)) {
      return res.status(403).json({
        error: 'Akses ditolak. Role Anda tidak diizinkan untuk operasi ini.',
        requiredRoles: allowedRoles,
        actualRole: role ?? null
      });
    }
    return next();
  };
};

module.exports = { requireRole };
