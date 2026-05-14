const engagementLetterApprovalsRepo = require('../repositories/engagement-letter-approvals.repo');
const { normalizeEngagementId } = require('../repositories/lead-workspace-engagements.repo');

const sendError = (res, e) => {
  // eslint-disable-next-line no-console
  console.error('[engagement-letter-approvals.controller] error:', e);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const parseEngagementIdParam = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const raw = String(value).trim();
  if (raw.length === 0 || !/^\d+$/.test(raw)) {
    return null;
  }
  return Number(raw);
};

const requireEngagementIdParam = (req, res) => {
  const id = parseEngagementIdParam(req.params.engagementId);
  if (normalizeEngagementId(id) == null) {
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
    case 'INVALID_ENGAGEMENT_ID':
      return res.status(400).json({ success: false, message: 'Engagement ID tidak valid.' });
    case 'NOTE_REQUIRED':
      return res.status(400).json({ success: false, message: 'Revision note wajib diisi.' });
    case 'NOT_FOUND':
      return res.status(404).json({ success: false, message: 'Engagement letter tidak ditemukan atau tidak menunggu approval.' });
    case 'NOT_PENDING':
      return res.status(409).json({ success: false, message: 'Engagement letter tidak sedang menunggu approval CEO.' });
    case 'APPROVAL_NOT_FOUND':
      return res.status(409).json({ success: false, message: 'Approval engagement letter tidak ditemukan atau sudah diputuskan.' });
    case 'APPROVAL_ALREADY_DECIDED':
      return res.status(409).json({ success: false, message: 'Approval engagement letter sudah diputuskan.' });
    default:
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const listPending = async (req, res) => {
  try {
    const result = await engagementLetterApprovalsRepo.listPendingEngagementLetters();
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.json({ success: true, data: { items: result.items } });
  } catch (e) {
    return sendError(res, e);
  }
};

const getDetail = async (req, res) => {
  const engagementId = requireEngagementIdParam(req, res);
  if (engagementId == null) return;

  try {
    const result = await engagementLetterApprovalsRepo.getPendingEngagementLetterDetail(engagementId);
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    return sendError(res, e);
  }
};

const approve = async (req, res) => {
  const engagementId = requireEngagementIdParam(req, res);
  if (engagementId == null) return;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return;

  try {
    const result = await engagementLetterApprovalsRepo.approveEngagementLetter(engagementId, userId);
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.json({ success: true, data: {} });
  } catch (e) {
    return sendError(res, e);
  }
};

const reject = async (req, res) => {
  const engagementId = requireEngagementIdParam(req, res);
  if (engagementId == null) return;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return;

  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
  if (!note) {
    return res.status(400).json({ success: false, message: 'Revision note wajib diisi.' });
  }

  try {
    const result = await engagementLetterApprovalsRepo.rejectEngagementLetter(engagementId, note, userId);
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.json({ success: true, data: {} });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  listPending,
  getDetail,
  approve,
  reject
};
