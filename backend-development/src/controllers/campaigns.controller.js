const campaignsRepo = require('../repositories/campaigns.repo');
const { ValidationError, requireString } = require('../utils/validation');

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const sendError = (res, e) => {
  if (e instanceof ValidationError) return res.status(400).json({ error: e.message });
  // eslint-disable-next-line no-console
  console.error('[campaigns.controller] error:', e);
  return res.status(500).json({ error: 'Internal server error' });
};

const getUserIdFromRequest = (req, res) => {
  const id = Number(req.user?.sub);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(401).json({ error: 'Token tidak berisi user ID yang valid.' });
    return null;
  }
  return id;
};

const requirePositiveInt = (value, fieldName) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ValidationError(`${fieldName} harus bilangan bulat positif.`);
  }
  return n;
};

const requireIsoDate = (value, fieldName) => {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) {
    throw new ValidationError(`${fieldName} harus format YYYY-MM-DD.`);
  }
  return value;
};

const optionalIsoDate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') return null;
  return requireIsoDate(value, fieldName);
};

const optionalNullableString = (value, fieldName, max) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} harus berupa string.`);
  }
  const t = value.trim();
  if (t.length === 0) return null;
  if (t.length > max) {
    throw new ValidationError(`${fieldName} maksimal ${max} karakter.`);
  }
  return t;
};

/**
 * Payload sama untuk POST dan PATCH (semua field yang boleh di-set).
 */
const parseWritePayload = (body) => {
  const b = body || {};
  const campaign_type_id = requirePositiveInt(b.campaign_type_id, 'campaign_type_id');
  const topic_id = requirePositiveInt(b.topic_id, 'topic_id');
  const name = requireString(b.name, 'name', { min: 1, max: 200 });
  const start_date = requireIsoDate(b.start_date, 'start_date');
  const end_date = optionalIsoDate(b.end_date, 'end_date');
  const notes = optionalNullableString(b.notes, 'notes', 65535);
  const image_path = optionalNullableString(b.image_path, 'image_path', 255);
  return {
    campaign_type_id,
    topic_id,
    name,
    start_date,
    end_date,
    notes,
    image_path
  };
};

const assertOwnership = (campaign, userId) => {
  if (Number(campaign.created_by) !== Number(userId)) {
    return false;
  }
  return true;
};

const listTypes = async (_req, res) => {
  try {
    const campaign_types = await campaignsRepo.listActiveTypes();
    return res.json({ campaign_types });
  } catch (e) {
    return sendError(res, e);
  }
};

const listTopics = async (_req, res) => {
  try {
    const topics = await campaignsRepo.listActiveTopics();
    return res.json({ topics });
  } catch (e) {
    return sendError(res, e);
  }
};

const list = async (_req, res) => {
  try {
    const campaigns = await campaignsRepo.listAllWithJoins();
    return res.json({ campaigns });
  } catch (e) {
    return sendError(res, e);
  }
};

const detail = async (req, res) => {
  try {
    const campaign_id = requirePositiveInt(req.params.id, 'campaign_id');
    const campaign = await campaignsRepo.findByIdWithJoins(campaign_id);
    if (!campaign) return res.status(404).json({ error: 'Campaign tidak ditemukan.' });
    return res.json({ campaign });
  } catch (e) {
    return sendError(res, e);
  }
};

const create = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const p = parseWritePayload(req.body);
    const campaign_id = await campaignsRepo.create({
      campaignTypeId: p.campaign_type_id,
      topicId: p.topic_id,
      name: p.name,
      status: 'ACTIVE',
      startDate: p.start_date,
      endDate: p.end_date,
      notes: p.notes,
      imagePath: p.image_path,
      createdBy: userId
    });
    const campaign = await campaignsRepo.findByIdWithJoins(campaign_id);
    return res.status(201).json({ campaign });
  } catch (e) {
    return sendError(res, e);
  }
};

const update = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const campaign_id = requirePositiveInt(req.params.id, 'campaign_id');
    const existing = await campaignsRepo.findByIdWithJoins(campaign_id);
    if (!existing) return res.status(404).json({ error: 'Campaign tidak ditemukan.' });
    if (!assertOwnership(existing, userId)) {
      return res.status(403).json({ error: 'Anda hanya dapat mengubah campaign yang Anda buat.' });
    }

    const p = parseWritePayload(req.body);
    await campaignsRepo.update(campaign_id, {
      campaignTypeId: p.campaign_type_id,
      topicId: p.topic_id,
      name: p.name,
      startDate: p.start_date,
      endDate: p.end_date,
      notes: p.notes,
      imagePath: p.image_path
    });
    const campaign = await campaignsRepo.findByIdWithJoins(campaign_id);
    return res.json({ campaign });
  } catch (e) {
    return sendError(res, e);
  }
};

const archive = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId === null) return;
    const campaign_id = requirePositiveInt(req.params.id, 'campaign_id');
    const existing = await campaignsRepo.findByIdWithJoins(campaign_id);
    if (!existing) return res.status(404).json({ error: 'Campaign tidak ditemukan.' });
    if (!assertOwnership(existing, userId)) {
      return res.status(403).json({ error: 'Anda hanya dapat mengarsipkan campaign yang Anda buat.' });
    }
    await campaignsRepo.setArchived(campaign_id);
    return res.json({
      success: true,
      message: 'Campaign berhasil diarsipkan.'
    });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  listTypes,
  listTopics,
  list,
  detail,
  create,
  update,
  archive
};
