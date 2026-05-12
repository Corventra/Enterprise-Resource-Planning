const leadWorkspaceRepo = require('../repositories/lead-workspace.repo');
const { ValidationError, requireString, requireEmail } = require('../utils/validation');

const sendError = (res, e) => {
  if (e instanceof ValidationError) {
    return res.status(400).json({ success: false, message: e.message });
  }
  // eslint-disable-next-line no-console
  console.error('[lead-workspace.controller] error:', e);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const parseLeadIdParam = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const raw = String(value).trim();
  if (raw.length === 0 || !/^\d+$/.test(raw)) {
    return null;
  }
  const leadId = Number(raw);
  if (!Number.isSafeInteger(leadId) || leadId <= 0) {
    return null;
  }
  return leadId;
};

const requireLeadIdParam = (req, res) => {
  const leadId = parseLeadIdParam(req.params.leadId);
  if (leadId == null) {
    res.status(400).json({ success: false, message: 'Lead ID tidak valid.' });
    return null;
  }
  return leadId;
};

const getUserIdFromRequest = (req, res) => {
  const id = Number(req.user?.sub);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(401).json({ success: false, message: 'Token tidak berisi user ID yang valid.' });
    return null;
  }
  return id;
};

const optionalString = (value, fieldName, { max = 65535 } = {}) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} harus berupa string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > max) {
    throw new ValidationError(`${fieldName} maksimal ${max} karakter.`);
  }
  return trimmed;
};

const parseDetailsPayload = (body) => ({
  company_name: requireString(body.company_name, 'Company Name', { max: 200 }),
  company_address: requireString(body.company_address, 'Company Address', { max: 255 }),
  pic_name: requireString(body.pic_name, 'PIC Name', { max: 150 }),
  email: requireEmail(body.email, 'Email'),
  phone_number: requireString(body.phone_number, 'Phone Number', { max: 50 }),
  desired_services: optionalString(body.desired_services, 'Desired Services')
});

const getDetail = async (req, res) => {
  try {
    const leadId = requireLeadIdParam(req, res);
    if (leadId == null) return undefined;
    const entry = await leadWorkspaceRepo.findWorkspaceDetail(leadId);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Lead workspace tidak ditemukan.' });
    }
    return res.json({ success: true, data: { entry } });
  } catch (e) {
    return sendError(res, e);
  }
};

const updateDetails = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;
    const leadId = requireLeadIdParam(req, res);
    if (leadId == null) return undefined;
    const payload = parseDetailsPayload(req.body || {});
    const result = await leadWorkspaceRepo.updateWorkspaceDetails(leadId, payload, userId);
    if (!result.ok) {
      return res.status(404).json({ success: false, message: 'Lead workspace tidak ditemukan.' });
    }
    return res.json({
      success: true,
      message: 'Detail lead berhasil diperbarui.',
      data: { entry: result.entry }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  getDetail,
  updateDetails
};
