const bankDataRepo = require('../repositories/bank-data.repo');
const { ValidationError } = require('../utils/validation');

const sendError = (res, e) => {
  if (e instanceof ValidationError) {
    return res.status(400).json({ success: false, message: e.message });
  }
  // eslint-disable-next-line no-console
  console.error('[bank-data.controller] error:', e);
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
  const raw = req.user?.sub ?? req.user?.id ?? req.user?.userId;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(401).json({ success: false, message: 'Token tidak berisi user ID yang valid.' });
    return null;
  }
  return id;
};

const list = async (req, res) => {
  try {
    const entries = await bankDataRepo.listFormLeadCapture();
    return res.json({ success: true, data: { entries } });
  } catch (e) {
    return sendError(res, e);
  }
};

const getDetail = async (req, res) => {
  try {
    const leadId = requirePositiveInt(req.params.leadId, 'Lead ID');
    const entry = await bankDataRepo.findFormLeadCaptureDetail(leadId);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Lead Bank Data tidak ditemukan.' });
    }
    return res.json({ success: true, data: { entry } });
  } catch (e) {
    return sendError(res, e);
  }
};

const process = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;
    const leadId = requirePositiveInt(req.params.leadId, 'Lead ID');
    const result = await bankDataRepo.processLead(leadId, userId);
    if (!result.ok) {
      return res.status(400).json({
        success: false,
        message: 'Lead hanya dapat diproses saat status Bank Data masih NEW.'
      });
    }
    const entry = await bankDataRepo.findFormLeadCaptureDetail(leadId);
    return res.json({
      success: true,
      message: 'Lead berhasil diproses ke Lead Tracker.',
      data: { entry }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

const archive = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;
    const leadId = requirePositiveInt(req.params.leadId, 'Lead ID');
    const result = await bankDataRepo.archiveLead(leadId, userId);
    if (!result.ok) {
      return res.status(400).json({
        success: false,
        message: 'Lead hanya dapat diarsipkan saat status Bank Data masih NEW.'
      });
    }
    const entry = await bankDataRepo.findFormLeadCaptureDetail(leadId);
    return res.json({
      success: true,
      message: 'Lead berhasil diarsipkan dari Bank Data.',
      data: { entry }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  list,
  getDetail,
  process,
  archive
};
