const leadMeetingsRepo = require('../repositories/lead-meetings.repo');
const { ensureLeadWorkspaceOperator } = require('../utils/lead-workspace-operator');
const { ValidationError, requireString } = require('../utils/validation');

const sendError = (res, e) => {
  if (e instanceof ValidationError) {
    return res.status(400).json({ success: false, message: e.message });
  }
  // eslint-disable-next-line no-console
  console.error('[lead-workspace-meetings.controller] error:', e);
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

const parseMeetingIdParam = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const raw = String(value).trim();
  if (raw.length === 0 || !/^\d+$/.test(raw)) {
    return null;
  }
  const meetingId = Number(raw);
  if (!Number.isSafeInteger(meetingId) || meetingId <= 0) {
    return null;
  }
  return meetingId;
};

const requireLeadIdParam = (req, res) => {
  const leadId = parseLeadIdParam(req.params.leadId);
  if (leadId == null) {
    res.status(400).json({ success: false, message: 'Lead ID tidak valid.' });
    return null;
  }
  return leadId;
};

const requireMeetingIdParam = (req, res) => {
  const meetingId = parseMeetingIdParam(req.params.meetingId);
  if (meetingId == null) {
    res.status(400).json({ success: false, message: 'Meeting ID tidak valid.' });
    return null;
  }
  return meetingId;
};

const getUserIdFromRequest = (req, res) => {
  const id = Number(req.user?.sub);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(401).json({ success: false, message: 'Token tidak berisi user ID yang valid.' });
    return null;
  }
  return id;
};

const optionalText = (value, fieldName, { max = 65535 } = {}) => {
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

const requireDateTime = (value, fieldName) => {
  const trimmed = requireString(value, fieldName, { min: 10, max: 64 });
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} tidak valid.`);
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
};

const requireMeetingMode = (value) => {
  const mode = requireString(value, 'Meeting Mode', { max: 16 }).toUpperCase();
  if (mode !== 'ONLINE' && mode !== 'OFFLINE') {
    throw new ValidationError('Meeting Mode harus ONLINE atau OFFLINE.');
  }
  return mode;
};

const parseMeetingPayload = (body) => {
  const meetingMode = requireMeetingMode(body.meeting_mode);
  const meetingAccess = requireString(body.meeting_access, 'Platform/Location', { max: 500 });
  return {
    title: requireString(body.title, 'Meeting Title', { max: 200 }),
    meeting_datetime: requireDateTime(body.meeting_datetime, 'Date & Time'),
    meeting_mode: meetingMode,
    meeting_access: meetingAccess,
    notes: optionalText(body.notes, 'Notes')
  };
};

const parseParticipantNames = (value, fieldName) => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} harus berupa array.`);
  }
  return value
    .map((item, index) => {
      if (typeof item !== 'string') {
        throw new ValidationError(`${fieldName}[${index}] harus berupa string.`);
      }
      return item.trim();
    })
    .filter((item) => item.length > 0);
};

const parseAgreements = (value) => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new ValidationError('Agreements harus berupa array.');
  }
  return value.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new ValidationError(`Agreements[${index}] tidak valid.`);
    }
    return {
      item: requireString(item.item, `Agreements[${index}].item`, { max: 255 }),
      details: optionalText(item.details, `Agreements[${index}].details`)
    };
  });
};

const buildParticipantsPayload = (body) => {
  const internal = parseParticipantNames(body.internal_participants, 'Internal Participants');
  const client = parseParticipantNames(body.client_participants, 'Client Participants');
  return [
    ...internal.map((participant_name) => ({ participant_type: 'INTERNAL', participant_name })),
    ...client.map((participant_name) => ({ participant_type: 'CLIENT', participant_name }))
  ];
};

const parseMinutesPayload = (body) => ({
  meeting_objectives: optionalText(body.meeting_objectives, 'Meeting Objectives'),
  background_summary: optionalText(body.background_summary, 'Background Summary'),
  issues_discussed: optionalText(body.issues_discussed, 'Issues Discussed'),
  info_client: optionalText(body.info_client, 'Information from Client'),
  info_firm: optionalText(body.info_firm, 'Information from Our Firm'),
  risk_concerns: optionalText(body.risk_concerns, 'Risks / Concerns'),
  next_steps: optionalText(body.next_steps, 'Next Steps'),
  notes_follow_up: optionalText(body.notes_follow_up, 'Notes & Follow-Up'),
  participants: buildParticipantsPayload(body),
  agreements: parseAgreements(body.agreements)
});

const listMeetings = async (req, res) => {
  try {
    const leadId = requireLeadIdParam(req, res);
    if (leadId == null) return undefined;
    const items = await leadMeetingsRepo.listMeetings(leadId);
    if (items == null) {
      return res.status(404).json({ success: false, message: 'Lead workspace tidak ditemukan.' });
    }
    return res.json({ success: true, data: { items } });
  } catch (e) {
    return sendError(res, e);
  }
};

const createMeeting = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;
    const leadId = requireLeadIdParam(req, res);
    if (leadId == null) return undefined;
    if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) return undefined;
    const payload = parseMeetingPayload(req.body || {});
    const result = await leadMeetingsRepo.createMeeting(leadId, payload, userId);
    if (!result.ok) {
      return res.status(404).json({ success: false, message: 'Lead workspace tidak ditemukan.' });
    }
    return res.status(201).json({
      success: true,
      message: 'Meeting berhasil dijadwalkan.',
      data: { meeting: result.meeting }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

const cancelMeeting = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;
    const leadId = requireLeadIdParam(req, res);
    if (leadId == null) return undefined;
    const meetingId = requireMeetingIdParam(req, res);
    if (meetingId == null) return undefined;
    if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) return undefined;
    const result = await leadMeetingsRepo.cancelMeeting(leadId, meetingId, userId);
    if (!result.ok) {
      if (result.reason === 'ALREADY_CANCELLED') {
        return res.status(409).json({ success: false, message: 'Meeting sudah dibatalkan.' });
      }
      if (result.reason === 'ALREADY_DONE') {
        return res.status(409).json({ success: false, message: 'Meeting yang sudah selesai tidak dapat dibatalkan.' });
      }
      if (result.reason === 'NOT_SCHEDULED') {
        return res.status(409).json({ success: false, message: 'Meeting tidak dapat dibatalkan.' });
      }
      return res.status(404).json({ success: false, message: 'Meeting tidak ditemukan.' });
    }
    return res.json({
      success: true,
      message: 'Meeting berhasil dibatalkan.',
      data: { meeting: result.meeting }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

const completeMeeting = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;
    const leadId = requireLeadIdParam(req, res);
    if (leadId == null) return undefined;
    const meetingId = requireMeetingIdParam(req, res);
    if (meetingId == null) return undefined;
    if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) return undefined;
    const result = await leadMeetingsRepo.completeMeeting(leadId, meetingId, userId);
    if (!result.ok) {
      if (result.reason === 'ALREADY_DONE') {
        return res.status(409).json({ success: false, message: 'Meeting sudah selesai dan tidak dapat diubah.' });
      }
      if (result.reason === 'NOT_SCHEDULED') {
        return res.status(409).json({ success: false, message: 'Meeting tidak dapat ditandai selesai.' });
      }
      return res.status(404).json({ success: false, message: 'Meeting tidak ditemukan.' });
    }
    return res.json({
      success: true,
      message: 'Meeting ditandai selesai.',
      data: { meeting: result.meeting }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

const getMinutes = async (req, res) => {
  try {
    const leadId = requireLeadIdParam(req, res);
    if (leadId == null) return undefined;
    const meetingId = requireMeetingIdParam(req, res);
    if (meetingId == null) return undefined;
    const entry = await leadMeetingsRepo.getMeetingMinutes(leadId, meetingId);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Meeting tidak ditemukan.' });
    }
    return res.json({ success: true, data: { entry } });
  } catch (e) {
    return sendError(res, e);
  }
};

const createMinutes = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;
    const leadId = requireLeadIdParam(req, res);
    if (leadId == null) return undefined;
    const meetingId = requireMeetingIdParam(req, res);
    if (meetingId == null) return undefined;
    if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) return undefined;
    const payload = parseMinutesPayload(req.body || {});
    const result = await leadMeetingsRepo.createMinutes(leadId, meetingId, payload, userId);
    if (!result.ok) {
      if (result.reason === 'MINUTES_EXISTS') {
        return res.status(409).json({ success: false, message: 'Notulensi untuk meeting ini sudah ada.' });
      }
      return res.status(404).json({ success: false, message: 'Meeting tidak ditemukan.' });
    }
    return res.status(201).json({
      success: true,
      message: 'Notulensi berhasil dibuat.',
      data: { entry: result.entry }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

const updateMinutes = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;
    const leadId = requireLeadIdParam(req, res);
    if (leadId == null) return undefined;
    const meetingId = requireMeetingIdParam(req, res);
    if (meetingId == null) return undefined;
    if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) return undefined;
    const payload = parseMinutesPayload(req.body || {});
    const result = await leadMeetingsRepo.updateMinutes(leadId, meetingId, payload, userId);
    if (!result.ok) {
      if (result.reason === 'MINUTES_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Notulensi belum dibuat.' });
      }
      return res.status(404).json({ success: false, message: 'Meeting tidak ditemukan.' });
    }
    return res.json({
      success: true,
      message: 'Notulensi berhasil diperbarui.',
      data: { entry: result.entry }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

const updateMeeting = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;
    const leadId = requireLeadIdParam(req, res);
    if (leadId == null) return undefined;
    const meetingId = requireMeetingIdParam(req, res);
    if (meetingId == null) return undefined;
    if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) return undefined;
    const payload = parseMeetingPayload(req.body || {});
    const result = await leadMeetingsRepo.updateMeeting(leadId, meetingId, payload, userId);
    if (!result.ok) {
      if (result.reason === 'NOT_EDITABLE') {
        return res.status(409).json({ success: false, message: 'Meeting tidak dapat diubah.' });
      }
      return res.status(404).json({ success: false, message: 'Meeting tidak ditemukan.' });
    }
    return res.json({
      success: true,
      message: 'Meeting berhasil diperbarui.',
      data: { meeting: result.meeting }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  listMeetings,
  createMeeting,
  cancelMeeting,
  completeMeeting,
  updateMeeting,
  getMinutes,
  createMinutes,
  updateMinutes
};
