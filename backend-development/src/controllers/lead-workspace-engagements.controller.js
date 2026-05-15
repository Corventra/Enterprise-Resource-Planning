const leadWorkspaceEngagementsRepo = require('../repositories/lead-workspace-engagements.repo');
const leadWorkspaceEngagementsWriteRepo = require('../repositories/lead-workspace-engagements-write.repo');
const engagementLetterSignedRepo = require('../repositories/engagement-letter-signed.repo');
const { ensureLeadWorkspaceOperator } = require('../utils/lead-workspace-operator');
const { ValidationError } = require('../utils/validation');
const { safeUnlinkOldUploadFile } = require('../utils/file');

const sendError = (res, e) => {
  if (e instanceof ValidationError) {
    return res.status(400).json({ success: false, message: e.message });
  }
  // eslint-disable-next-line no-console
  console.error('[lead-workspace-engagements.controller] error:', e);
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

const parseEngagementIdParam = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const raw = String(value).trim();
  if (raw.length === 0 || !/^\d+$/.test(raw)) {
    return null;
  }
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }
  return id;
};

const requireLeadIdParam = (req, res) => {
  const leadId = parseLeadIdParam(req.params.leadId);
  if (leadId == null) {
    res.status(400).json({ success: false, message: 'Lead ID tidak valid.' });
    return null;
  }
  return leadId;
};

const requireEngagementIdParam = (req, res) => {
  const id = parseEngagementIdParam(req.params.engagementId);
  if (id == null) {
    res.status(400).json({ success: false, message: 'Engagement ID tidak valid.' });
    return null;
  }
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

const mapRepoFailure = (res, result) => {
  switch (result.reason) {
    case 'INVALID_LEAD_ID':
      return res.status(400).json({ success: false, message: 'Lead ID tidak valid.' });
    case 'NOT_FOUND':
      return res.status(404).json({ success: false, message: 'Lead tidak ditemukan.' });
    default:
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const mapWriteFailure = (res, result) => {
  if (result.reason === 'VALIDATION' && result.message) {
    return res.status(400).json({ success: false, message: result.message });
  }
  switch (result.reason) {
    case 'INVALID_LEAD_ID':
    case 'INVALID_ID':
      return res.status(400).json({ success: false, message: 'ID tidak valid.' });
    case 'NOT_FOUND':
      return res.status(404).json({ success: false, message: 'Engagement letter tidak ditemukan.' });
    case 'NOT_DRAFT':
      return res.status(409).json({ success: false, message: 'Hanya draft engagement letter yang dapat diubah/dihapus.' });
    case 'NOT_EDITABLE':
      return res
        .status(409)
        .json({ success: false, message: 'Engagement letter tidak dapat diubah pada status ini.' });
    case 'DOCUMENT_REQUIRED':
      return res.status(400).json({ success: false, message: 'Dokumen engagement letter (PDF) wajib diunggah.' });
    case 'STAGE_NOT_EL':
    case 'NO_PROPOSAL':
    case 'PROPOSAL_NOT_RESPONDED':
      return res.status(409).json({ success: false, message: result.message || 'Lead belum siap untuk engagement letter.' });
    case 'ALREADY_PENDING':
      return res.status(409).json({ success: false, message: 'Engagement letter sudah memiliki approval pending.' });
    case 'NOT_APPROVED':
      return res
        .status(409)
        .json({ success: false, message: 'Engagement letter hanya dapat ditandai terkirim saat status Disetujui (APPROVED).' });
    case 'NOT_SENT':
      return res
        .status(409)
        .json({ success: false, message: 'Engagement letter hanya dapat ditandai signed saat status Terkirim (SENT).' });
    case 'ALREADY_SIGNED':
      return res.status(409).json({ success: false, message: 'Engagement letter sudah ditandatangani.' });
    case 'ALREADY_PROVISIONED':
      return res.status(409).json({
        success: false,
        message: 'Handover atau akun invoice untuk engagement ini sudah ada.'
      });
    case 'TERMIN_DATA_INVALID':
    case 'RETAINER_DATA_INVALID':
    case 'RETAINER_PERIOD_INVALID':
      return res.status(409).json({
        success: false,
        message: 'Data pembayaran engagement letter tidak lengkap untuk membuat invoice.'
      });
    default:
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const dbPathFromEngagementUpload = (file) => {
  if (!file || !file.filename) return null;
  return `/uploads/engagement-letters/${file.filename}`;
};

const fileMetaFromUploadedFile = (file) => {
  const filePath = dbPathFromEngagementUpload(file);
  if (!filePath) {
    return null;
  }
  return {
    documentName: file.originalname || file.filename,
    fileName: file.filename,
    filePath,
    mimeType: file.mimetype || null,
    fileSizeBytes: file.size ?? null
  };
};

const parseJsonField = (raw, label) => {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return null;
  }
  try {
    return JSON.parse(String(raw));
  } catch {
    throw new ValidationError(`${label} tidak valid (JSON).`);
  }
};

const buildBodyFromRequest = (req) => {
  const b = req.body || {};
  const termins = parseJsonField(b.termins_json, 'termins_json');
  const retainer = parseJsonField(b.retainer_json, 'retainer_json');
  const rawAction = String(b.action ?? 'draft').trim().toLowerCase();
  const action = rawAction === 'submit' ? 'submit' : 'draft';
  return {
    issuer_company: b.issuer_company,
    agreed_fee: b.agreed_fee,
    payment_method: b.payment_method,
    termins: Array.isArray(termins) ? termins : [],
    retainer: retainer && typeof retainer === 'object' ? retainer : null,
    action
  };
};

const getEngagementLetterBundle = async (req, res) => {
  const leadId = requireLeadIdParam(req, res);
  if (leadId == null) return;

  try {
    const result = await leadWorkspaceEngagementsRepo.getEngagementLetterWorkspaceBundle(leadId);
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    return sendError(res, e);
  }
};

const createDraftEngagementLetter = async (req, res) => {
  const leadId = requireLeadIdParam(req, res);
  if (leadId == null) return;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return;
  if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) {
    return undefined;
  }

  const fileMeta = fileMetaFromUploadedFile(req.file);
  if (!fileMeta) {
    return res.status(400).json({ success: false, message: 'Dokumen engagement letter (PDF) wajib diunggah.' });
  }

  try {
    const body = buildBodyFromRequest(req);
    const result = await leadWorkspaceEngagementsWriteRepo.createDraftEngagementLetter(leadId, body, fileMeta, userId);
    if (!result.ok) {
      await safeUnlinkOldUploadFile(fileMeta.filePath);
      return mapWriteFailure(res, result);
    }
    return res.status(201).json({ success: true, data: { item: result.item } });
  } catch (e) {
    await safeUnlinkOldUploadFile(fileMeta.filePath);
    return sendError(res, e);
  }
};

const updateDraftEngagementLetter = async (req, res) => {
  const leadId = requireLeadIdParam(req, res);
  if (leadId == null) return;
  const engagementId = requireEngagementIdParam(req, res);
  if (engagementId == null) return;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return;
  if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) {
    return undefined;
  }

  const newFileMeta = fileMetaFromUploadedFile(req.file);

  try {
    const body = buildBodyFromRequest(req);
    const result = await leadWorkspaceEngagementsWriteRepo.updateDraftEngagementLetter(
      leadId,
      engagementId,
      body,
      newFileMeta,
      userId
    );
    if (!result.ok) {
      if (newFileMeta) await safeUnlinkOldUploadFile(newFileMeta.filePath);
      return mapWriteFailure(res, result);
    }
    return res.json({ success: true, data: { item: result.item } });
  } catch (e) {
    if (newFileMeta) await safeUnlinkOldUploadFile(newFileMeta.filePath);
    return sendError(res, e);
  }
};

const deleteDraftEngagementLetter = async (req, res) => {
  const leadId = requireLeadIdParam(req, res);
  if (leadId == null) return;
  const engagementId = requireEngagementIdParam(req, res);
  if (engagementId == null) return;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return;
  if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) {
    return undefined;
  }

  try {
    const result = await leadWorkspaceEngagementsWriteRepo.deleteDraftEngagementLetter(leadId, engagementId);
    if (!result.ok) {
      return mapWriteFailure(res, result);
    }
    return res.json({ success: true, data: {} });
  } catch (e) {
    return sendError(res, e);
  }
};

const submitEngagementLetter = async (req, res) => {
  const leadId = requireLeadIdParam(req, res);
  if (leadId == null) return;
  const engagementId = requireEngagementIdParam(req, res);
  if (engagementId == null) return;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return;
  if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) {
    return undefined;
  }

  try {
    const result = await leadWorkspaceEngagementsWriteRepo.submitEngagementLetter(leadId, engagementId, userId);
    if (!result.ok) {
      return mapWriteFailure(res, result);
    }
    return res.json({ success: true, data: { item: result.item } });
  } catch (e) {
    return sendError(res, e);
  }
};

const markEngagementLetterSigned = async (req, res) => {
  const leadId = requireLeadIdParam(req, res);
  if (leadId == null) return;
  const engagementId = requireEngagementIdParam(req, res);
  if (engagementId == null) return;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return;
  if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) {
    return undefined;
  }

  try {
    const result = await engagementLetterSignedRepo.markEngagementLetterSigned(leadId, engagementId, userId);
    if (!result.ok) {
      return mapWriteFailure(res, result);
    }
    return res.json({
      success: true,
      data: { item: result.item, provisioning: result.provisioning ?? null }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

const markEngagementLetterSentToClient = async (req, res) => {
  const leadId = requireLeadIdParam(req, res);
  if (leadId == null) return;
  const engagementId = requireEngagementIdParam(req, res);
  if (engagementId == null) return;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return;
  if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) {
    return undefined;
  }

  try {
    const result = await leadWorkspaceEngagementsWriteRepo.markEngagementLetterSentToClient(leadId, engagementId, userId);
    if (!result.ok) {
      return mapWriteFailure(res, result);
    }
    return res.json({ success: true, data: { item: result.item } });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  getEngagementLetterBundle,
  createDraftEngagementLetter,
  updateDraftEngagementLetter,
  deleteDraftEngagementLetter,
  submitEngagementLetter,
  markEngagementLetterSentToClient,
  markEngagementLetterSigned
};
