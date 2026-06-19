const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/user.repo');
const permissionRepo = require('../repositories/permission.repo');
const { resolveEffectivePermissions } = require('../services/permission-resolver');
const { sign } = require('../utils/jwt');

const buildUserPublic = (user, permissions) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  departments: user.departments,
  permissions
});

const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }

  const ip = req.ip || req.headers['x-forwarded-for'] || null;
  const userAgent = req.headers['user-agent'] || null;

  let user;
  try {
    user = await userRepo.findByEmail(email);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[auth] findByEmail error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }

  if (!user) {
    await userRepo.logLoginAttempt({ userId: null, emailTried: email, ip, userAgent, success: false });
    return res.status(401).json({ error: 'Username atau password salah' });
  }

  if (!user.isActive) {
    await userRepo.logLoginAttempt({ userId: user.id, emailTried: email, ip, userAgent, success: false });
    return res.status(403).json({ error: 'Akun nonaktif. Hubungi Superadmin.' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    await userRepo.logLoginAttempt({ userId: user.id, emailTried: email, ip, userAgent, success: false });
    return res.status(401).json({ error: 'Username atau password salah' });
  }

  // Permission list untuk token: snapshot saat login. Perubahan di DB/resolver baru dipakai route guard setelah login ulang.
  const rolePermissionsFromDb = await permissionRepo.listCodesByRoleId(user.role.id);
  const permissions = resolveEffectivePermissions({
    roleCode: user.role.code,
    departments: user.departments,
    rolePermissionsFromDb
  });

  const token = sign({
    sub: user.id,
    email: user.email,
    role: user.role.code,
    departments: user.departments.map((d) => d.code),
    permissions
  });

  await userRepo.logLoginAttempt({ userId: user.id, emailTried: email, ip, userAgent, success: true });

  return res.json({
    token,
    user: buildUserPublic(user, permissions)
  });
};

const me = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ error: 'Token payload invalid' });
  }
  try {
    const user = await userRepo.findById(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User tidak aktif atau tidak ditemukan' });
    }
    // Selalu resolve dari DB + resolver terbaru (untuk tampilan /me). requirePermission tetap membaca permissions di JWT.
    const rolePermissionsFromDb = await permissionRepo.listCodesByRoleId(user.role.id);
    const permissions = resolveEffectivePermissions({
      roleCode: user.role.code,
      departments: user.departments,
      rolePermissionsFromDb
    });
    return res.json({ user: buildUserPublic(user, permissions) });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[auth] me error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const logout = async (_req, res) => {
  return res.json({ ok: true });
};

module.exports = { login, me, logout };
