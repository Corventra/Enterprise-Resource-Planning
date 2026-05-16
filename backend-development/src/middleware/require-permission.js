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
        error: 'Akses ditolak. Permission Anda tidak cukup untuk operasi ini.',
        requiredPermissions: required,
        mode
      });
    }
    return next();
  };
};

module.exports = { requirePermission };
