const deptRepo = require('../repositories/department.repo');
const { ValidationError, requireString } = require('../utils/validation');

const sendError = (res, e) => {
  if (e instanceof ValidationError) return res.status(400).json({ error: e.message });
  // eslint-disable-next-line no-console
  console.error('[departments.controller] error:', e);
  return res.status(500).json({ error: 'Internal server error' });
};

/**
 * Code department: uppercase, alphanum + underscore, 2-32 chars.
 * Dipakai di JWT payload, frontend permission map, dan FK reference dari
 * project.serviceLine. Karena banyak reference, code IMMUTABLE setelah create.
 */
const CODE_RE = /^[A-Z][A-Z0-9_]{1,31}$/;

const validateCode = (raw) => {
  const code = requireString(raw, 'code', { min: 2, max: 32 }).toUpperCase();
  if (!CODE_RE.test(code)) {
    throw new ValidationError('Code harus huruf besar, alphanum + underscore, mulai dengan huruf, 2-32 karakter.');
  }
  return code;
};

const list = async (_req, res) => {
  try {
    const departments = await deptRepo.listAllWithUserCount();
    return res.json({ departments });
  } catch (e) {
    return sendError(res, e);
  }
};

const detail = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('ID department tidak valid.');
    }
    const dept = await deptRepo.findById(id);
    if (!dept) return res.status(404).json({ error: 'Department tidak ditemukan.' });
    const userCount = await deptRepo.countUsers(id);
    return res.json({ department: { ...dept, userCount } });
  } catch (e) {
    return sendError(res, e);
  }
};

const create = async (req, res) => {
  try {
    const body = req.body || {};
    const code = validateCode(body.code);
    const name = requireString(body.name, 'name', { min: 1, max: 128 });
    if (await deptRepo.isCodeTaken(code)) {
      throw new ValidationError(`Code ${code} sudah digunakan department lain.`);
    }
    const id = await deptRepo.create({ code, name, isActive: true });
    const department = await deptRepo.findById(id);
    return res.status(201).json({ department: { ...department, userCount: 0 } });
  } catch (e) {
    return sendError(res, e);
  }
};

const update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('ID department tidak valid.');
    }
    const existing = await deptRepo.findById(id);
    if (!existing) return res.status(404).json({ error: 'Department tidak ditemukan.' });

    const body = req.body || {};
    const patch = {};
    if (body.name !== undefined) {
      patch.name = requireString(body.name, 'name', { min: 1, max: 128 });
    }
    if (body.isActive !== undefined) {
      patch.isActive = !!body.isActive;
    }
    if (body.code !== undefined && body.code !== existing.code) {
      throw new ValidationError(
        'Code department immutable. Bikin department baru kalau perlu code berbeda.'
      );
    }

    // Safety: kalau di-deactivate, warning saja (tidak block — user mungkin
    // memang mau deactivate sambil migrasi user ke department lain).
    await deptRepo.update(id, patch);
    const updated = await deptRepo.findById(id);
    const userCount = await deptRepo.countUsers(id);
    return res.json({ department: { ...updated, userCount } });
  } catch (e) {
    return sendError(res, e);
  }
};

const remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('ID department tidak valid.');
    }
    const existing = await deptRepo.findById(id);
    if (!existing) return res.status(404).json({ error: 'Department tidak ditemukan.' });

    const userCount = await deptRepo.countUsers(id);
    if (userCount > 0) {
      throw new ValidationError(
        `Department ${existing.code} masih punya ${userCount} user. Reassign user dulu, atau set inactive saja.`
      );
    }
    await deptRepo.deleteById(id);
    return res.json({ ok: true });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = { list, detail, create, update, remove };
