/**
 * Middleware factory: terima permission code (single string atau array), reject 403
 * kalau req.user.permissions tidak punya salah satu dari yang dibutuhkan.
 *
 * Pakai SETELAH authenticate. Permissions dibaca dari req.user (JWT), bukan dari DB —
 * samakan dengan token: setelah admin ubah hak di DB, user perlu login ulang agar guard ikut berubah.
 *
 * Mode:
 *   requirePermission('USER_MANAGE')         — wajib punya 1 permission
 *   requirePermission(['A','B'], 'any')      — punya salah satu (default)
 *   requirePermission(['A','B'], 'all')      — wajib punya semua
 */
const requirePermission = (permissions, mode = 'any') => {
  const required = Array.isArray(permissions) ? permissions : [permissions];
  if (required.length === 0) {
    throw new Error('requirePermission butuh minimal 1 permission');
  }
  if (mode !== 'any' && mode !== 'all') {
    throw new Error('requirePermission mode harus "any" atau "all"');
  }

  return (req, res, next) => {
    const userPerms = Array.isArray(req.user?.permissions) ? req.user.permissions : [];
    const has = mode === 'all'
      ? required.every((p) => userPerms.includes(p))
      : required.some((p) => userPerms.includes(p));

    if (!has) {
      return res.status(403).json({
        code: 'UNAUTHORIZED_ROLE',
        error: 'Akses ditolak. Permission Anda tidak cukup untuk operasi ini.',
        requiredPermissions: required,
        mode
      });
    }
    return next();
  };
};

/**
 * Middleware factory: lolos kalau user punya `permission` ATAU role-nya termasuk `fallbackRoles`.
 * Pakai SETELAH authenticate.
 *
 * Tujuan: jaring pengaman untuk permission yang baru ditambahkan setelah user login —
 * JWT mereka belum berisi permission baru, tapi role-nya tetap valid. Tanpa ini, user
 * harus logout/login dulu agar permission baru aktif.
 *
 * Contoh:
 *   requirePermissionOrRole('DASHBOARD_CEO_VIEW', ['CEO', 'SUPERADMIN'])
 */
const requirePermissionOrRole = (permission, fallbackRoles) => {
  if (typeof permission !== 'string' || !permission) {
    throw new Error('requirePermissionOrRole butuh permission code (string)');
  }
  if (!Array.isArray(fallbackRoles) || fallbackRoles.length === 0) {
    throw new Error('requirePermissionOrRole butuh array fallbackRoles non-empty');
  }
  const roleSet = new Set(fallbackRoles);

  return (req, res, next) => {
    const userPerms = Array.isArray(req.user?.permissions) ? req.user.permissions : [];
    const userRole = req.user?.role;
    const hasPermission = userPerms.includes(permission);
    const hasRole = userRole && roleSet.has(userRole);

    if (!hasPermission && !hasRole) {
      return res.status(403).json({
        code: 'UNAUTHORIZED_ROLE',
        error: 'Akses ditolak. Permission/role Anda tidak cukup untuk operasi ini.',
        requiredPermission: permission,
        fallbackRoles
      });
    }
    return next();
  };
};

module.exports = { requirePermission, requirePermissionOrRole };
