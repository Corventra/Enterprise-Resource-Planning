const leadTrackerRepo = require('../repositories/lead-tracker.repo');
const { ensureLeadWorkspaceOperator } = require('../utils/lead-workspace-operator');
const { ValidationError, requireString, requireEmail } = require('../utils/validation');

const sendError = (res, e) => {
  if (e instanceof ValidationError) {
    return res.status(400).json({ success: false, message: e.message });
  }
  // eslint-disable-next-line no-console
  console.error('[lead-tracker.controller] error:', e);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const requirePositiveInt = (value, fieldName) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ValidationError(`${fieldName} harus bilangan bulat positif.`);
  }
  return n;
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

const parseManualLeadPayload = (body) => ({
  company_name: requireString(body.company_name, 'Company Name', { max: 200 }),
  company_address: requireString(body.company_address, 'Company Address', { max: 255 }),
  pic_name: requireString(body.pic_name, 'PIC Name', { max: 150 }),
  email: requireEmail(body.email, 'Email'),
  phone_number: requireString(body.phone_number, 'Phone Number', { max: 50 }),
  desired_services: optionalString(body.desired_services, 'Desired Services')
});

const parseMarkLostPayload = (body) => {
  const lostReasonCode = requireString(body.lost_reason_code, 'Reason', { max: 64 }).toUpperCase();
  if (!leadTrackerRepo.LOST_REASON_CODES.includes(lostReasonCode)) {
    throw new ValidationError('Reason tidak valid.');
  }
  return {
    lost_reason_code: lostReasonCode,
    lost_reason_note: optionalString(body.lost_reason_note, 'Note')
  };
};

const list = async (req, res) => {
  try {
    const entries = await leadTrackerRepo.listTrackedLeads();
    return res.json({ success: true, data: { entries } });
  } catch (e) {
    return sendError(res, e);
  }
};

const createManual = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;
    const payload = parseManualLeadPayload(req.body || {});
    const entry = await leadTrackerRepo.createManualLead(payload, userId);
    return res.status(201).json({
      success: true,
      message: 'Lead manual berhasil dibuat.',
      data: { entry }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

const markLost = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;
    const leadId = requirePositiveInt(req.params.leadId, 'Lead ID');
    if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) return undefined;
    const payload = parseMarkLostPayload(req.body || {});
    const result = await leadTrackerRepo.markLeadLost(leadId, payload, userId);
    if (!result.ok) {
      return res.status(400).json({
        success: false,
        message: 'Lead hanya dapat ditandai lost saat status masih ACTIVE.'
      });
    }
    return res.json({
      success: true,
      message: 'Lead berhasil ditandai sebagai lost.',
      data: { entry: result.entry }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  list,
  createManual,
  markLost
};
