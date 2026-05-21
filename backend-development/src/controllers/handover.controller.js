const handoverRepo = require('../repositories/handover.repo');
const handoverWriteRepo = require('../repositories/handover-write.repo');
const { ensureLeadWorkspaceOperator } = require('../utils/lead-workspace-operator');
const { buildHandoverAccessFromRequest } = require('../utils/handover-access');
const { safeUnlinkOldUploadFile } = require('../utils/file');
const { ValidationError } = require('../utils/validation');

const HANDOVER_ORG_SUMMARY_ROLES = new Set(['CEO', 'COO', 'SUPERADMIN']);

const parseSummaryCreatedByOverride = (req) => {
  const raw = req.query.summary_created_by;
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return null;
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('summary_created_by harus bilangan bulat positif.');
  }
  return { summaryUserId: id, scope: 'filtered_user', summary_created_by: id };
};

const resolveSummaryScope = (req, userId) => {
  const role = String(req.user?.role ?? '')
    .trim()
    .toUpperCase();
  if (HANDOVER_ORG_SUMMARY_ROLES.has(role)) {
    const override = parseSummaryCreatedByOverride(req);
    if (override) return override;
    return { summaryUserId: null, scope: 'organization' };
  }
  return { summaryUserId: userId, scope: 'own_handovers' };
};

const sendError = (res, e) => {
  if (e instanceof ValidationError) {
    return res.status(400).json({ success: false, message: e.message });
  }
  // eslint-disable-next-line no-console
  console.error('[handover.controller] error:', e);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const parseHandoverIdParam = (value) => {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (raw.length === 0 || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return id;
};

const getUserIdFromRequest = (req, res) => {
  const id = Number(req.user?.sub);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(401).json({ success: false, message: 'Token tidak berisi user ID yang valid.' });
    return null;
  }
  return id;
};

const mapWriteFailure = (res, result) => {
  if (result.reason === 'VALIDATION' && result.message) {
    return res.status(400).json({ success: false, message: result.message });
  }
  switch (result.reason) {
    case 'INVALID_ID':
      return res.status(400).json({ success: false, message: 'Handover ID tidak valid.' });
    case 'NOT_FOUND':
      return res.status(404).json({ success: false, message: 'Handover tidak ditemukan.' });
    case 'FORBIDDEN':
      return res.status(403).json({
        success: false,
        message: 'Hanya BD yang memproses lead ini yang dapat mengelola handover.'
      });
    case 'NOT_DRAFT':
    case 'NOT_EDITABLE':
      return res.status(409).json({
        success: false,
        message: 'Handover hanya dapat diubah atau disubmit saat status Draft atau Revision Needed.'
      });
    case 'ALREADY_SUBMITTED':
      return res.status(409).json({ success: false, message: 'Handover sudah pernah disubmit.' });
    default:
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const listHandovers = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;

    const access = await buildHandoverAccessFromRequest(req);
    const summaryScope = resolveSummaryScope(req, userId);

    const [items, summary] = await Promise.all([
      handoverRepo.findHandoverList(access),
      handoverRepo.getHandoverSummary(summaryScope.summaryUserId)
    ]);

    const meta = { scope: summaryScope.scope };
    if (summaryScope.summary_created_by != null) {
      meta.summary_created_by = summaryScope.summary_created_by;
    }

    return res.json({
      success: true,
      data: { items, summary, meta }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

const getHandoverDetail = async (req, res) => {
  const handoverId = parseHandoverIdParam(req.params.handoverId);
  if (handoverId == null) {
    return res.status(400).json({ success: false, message: 'Handover ID tidak valid.' });
  }

  try {
    const access = await buildHandoverAccessFromRequest(req);
    const result = await handoverRepo.findHandoverDetail(handoverId, access);
    if (!result.ok) {
      if (result.reason === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Handover tidak ditemukan.' });
      }
      return res.status(400).json({ success: false, message: 'Handover ID tidak valid.' });
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    return sendError(res, e);
  }
};

const updateDraftHandover = async (req, res) => {
  const handoverId = parseHandoverIdParam(req.params.handoverId);
  if (handoverId == null) {
    return res.status(400).json({ success: false, message: 'Handover ID tidak valid.' });
  }
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return;

  const access = await buildHandoverAccessFromRequest(req);
  const detail = await handoverRepo.findHandoverDetail(handoverId, access);
  if (!detail.ok) {
    return mapWriteFailure(res, { reason: 'NOT_FOUND' });
  }
  if (!(await ensureLeadWorkspaceOperator(detail.data.lead_id, userId, res))) {
    return;
  }

  const payloadRaw = req.body?.payload ?? req.body;
  const files = Array.isArray(req.files) ? req.files : [];

  try {
    const result = await handoverWriteRepo.updateDraftHandover(handoverId, payloadRaw, files, userId);
    if (!result.ok) {
      for (const f of files) {
        if (f?.filename) await safeUnlinkOldUploadFile(`/uploads/handovers/${f.filename}`);
      }
      return mapWriteFailure(res, result);
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    for (const f of files) {
      if (f?.filename) await safeUnlinkOldUploadFile(`/uploads/handovers/${f.filename}`);
    }
    return sendError(res, e);
  }
};

const submitHandover = async (req, res) => {
  const handoverId = parseHandoverIdParam(req.params.handoverId);
  if (handoverId == null) {
    return res.status(400).json({ success: false, message: 'Handover ID tidak valid.' });
  }
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return;

  const access = await buildHandoverAccessFromRequest(req);
  const detail = await handoverRepo.findHandoverDetail(handoverId, access);
  if (!detail.ok) {
    return mapWriteFailure(res, { reason: 'NOT_FOUND' });
  }
  if (!(await ensureLeadWorkspaceOperator(detail.data.lead_id, userId, res))) {
    return;
  }

  try {
    const result = await handoverWriteRepo.submitHandover(handoverId, userId);
    if (!result.ok) {
      return mapWriteFailure(res, result);
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  listHandovers,
  getHandoverDetail,
  updateDraftHandover,
  submitHandover
};
