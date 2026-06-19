const userRepo = require('../repositories/user.repo');
const roleRepo = require('../repositories/role.repo');
const deptRepo = require('../repositories/department.repo');
const {
  ValidationError,
  requireString,
  requireEmail,
  requirePassword,
  optionalArray
} = require('../utils/validation');

const sendValidationError = (res, e) => {
  if (e instanceof ValidationError) {
    return res.status(400).json({ error: e.message });
  }
  // eslint-disable-next-line no-console
  console.error('[users.controller] error:', e);
  return res.status(500).json({ error: 'Internal server error' });
};

/**
 * Resolve role + departments dari payload, dengan validasi:
 * - role harus exist
 * - kalau role.is_department_scoped, butuh ≥1 department
 * - semua department codes harus exist
 */
const resolveRoleAndDepartments = async (roleCode, departmentCodes) => {
  const role = await roleRepo.findByCode(roleCode);
  if (!role) {
    throw new ValidationError(`Role "${roleCode}" tidak dikenal.`);
  }

  const codes = Array.isArray(departmentCodes) ? [...new Set(departmentCodes)] : [];
  if (role.isDepartmentScoped && codes.length === 0) {
    throw new ValidationError(`Role ${role.code} wajib punya minimal 1 department.`);
  }

  let depts = [];
  if (codes.length > 0) {
    depts = await deptRepo.findByCodes(codes);
    const found = new Set(depts.map((d) => d.code));
    const missing = codes.filter((c) => !found.has(c));
    if (missing.length > 0) {
      throw new ValidationError(`Department code tidak dikenal: ${missing.join(', ')}.`);
    }
  }

  // Preserve order user kasih (index 0 = primary)
  const departmentIds = codes.map((c) => depts.find((d) => d.code === c).id);
  return { role, departmentIds };
};

const list = async (req, res) => {
  try {
    const { search = '', role = null } = req.query;
    const users = await userRepo.listAll({ search, roleCode: role });
    return res.json({ users });
  } catch (e) {
    return sendValidationError(res, e);
  }
};

const detail = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('ID user tidak valid.');
    }
    const user = await userRepo.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }
    return res.json({ user });
  } catch (e) {
    return sendValidationError(res, e);
  }
};

const create = async (req, res) => {
  try {
    const body = req.body || {};
    const email = requireEmail(body.email);
    const name = requireString(body.name, 'name', { min: 1, max: 128 });
    const password = requirePassword(body.password);
    const roleCode = requireString(body.roleCode, 'roleCode', { min: 1, max: 32 });
    const deptCodes = optionalArray(body.departmentCodes, 'departmentCodes',
      (v) => requireString(v, 'departmentCode', { min: 1, max: 32 })
    ) ?? [];

    if (await userRepo.isEmailTaken(email)) {
      throw new ValidationError(`Email ${email} sudah terdaftar.`);
    }

    const { role, departmentIds } = await resolveRoleAndDepartments(roleCode, deptCodes);
    const newId = await userRepo.createWithDepartments({
      email, name, password, roleId: role.id, departmentIds
    });
    const user = await userRepo.findById(newId);
    return res.status(201).json({ user });
  } catch (e) {
    return sendValidationError(res, e);
  }
};

const update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('ID user tidak valid.');
    }
    const existing = await userRepo.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    const body = req.body || {};
    const patch = {};

    if (body.email !== undefined) {
      const email = requireEmail(body.email);
      if (await userRepo.isEmailTaken(email, id)) {
        throw new ValidationError(`Email ${email} sudah digunakan user lain.`);
      }
      patch.email = email;
    }
    if (body.name !== undefined) {
      patch.name = requireString(body.name, 'name', { min: 1, max: 128 });
    }
    if (body.isActive !== undefined) {
      patch.isActive = !!body.isActive;
    }

    let resolvedDeptIds = undefined;
    let resolvedRoleId = undefined;

    if (body.roleCode !== undefined || body.departmentCodes !== undefined) {
      const newRoleCode = body.roleCode !== undefined
        ? requireString(body.roleCode, 'roleCode', { min: 1, max: 32 })
        : existing.role.code;
      const newDeptCodes = body.departmentCodes !== undefined
        ? optionalArray(body.departmentCodes, 'departmentCodes',
            (v) => requireString(v, 'departmentCode', { min: 1, max: 32 }))
        : existing.departments.map((d) => d.code);

      const { role, departmentIds } = await resolveRoleAndDepartments(newRoleCode, newDeptCodes);
      resolvedRoleId = role.id;
      resolvedDeptIds = departmentIds;
    }

    // Safety: tidak boleh demote Superadmin terakhir
    if (
      existing.role.code === 'SUPERADMIN' &&
      ((resolvedRoleId !== undefined && resolvedRoleId !== existing.role.id) ||
        (patch.isActive !== undefined && !patch.isActive))
    ) {
      const total = await userRepo.countSuperadmins();
      if (total <= 1) {
        throw new ValidationError(
          'Tidak bisa mengubah role / nonaktifkan Superadmin terakhir. Buat Superadmin pengganti dulu.'
        );
      }
    }

    if (resolvedRoleId !== undefined) patch.roleId = resolvedRoleId;
    if (resolvedDeptIds !== undefined) patch.departmentIds = resolvedDeptIds;

    await userRepo.updateWithDepartments(id, patch);
    const user = await userRepo.findById(id);
    return res.json({ user });
  } catch (e) {
    return sendValidationError(res, e);
  }
};

const changePassword = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('ID user tidak valid.');
    }
    const existing = await userRepo.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }
    // TC-28 compatibility: terima `password` atau `newPassword` (preferensi newPassword).
    const body = req.body || {};
    const candidate = body.newPassword ?? body.password;
    const newPassword = requirePassword(candidate, 'password');
    await userRepo.updatePassword(id, newPassword);
    return res.json({ ok: true });
  } catch (e) {
    return sendValidationError(res, e);
  }
};

const remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('ID user tidak valid.');
    }
    const existing = await userRepo.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }
    if (req.user?.sub === id) {
      throw new ValidationError('Tidak bisa menghapus akun Anda sendiri.');
    }
    if (existing.role.code === 'SUPERADMIN') {
      const total = await userRepo.countSuperadmins();
      if (total <= 1) {
        throw new ValidationError('Tidak bisa menghapus Superadmin terakhir.');
      }
    }
    await userRepo.deleteById(id);
    return res.json({ ok: true });
  } catch (e) {
    return sendValidationError(res, e);
  }
};

module.exports = { list, detail, create, update, changePassword, remove };
