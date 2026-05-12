const leadWorkspaceProposalsRepo = require('../repositories/lead-workspace-proposals.repo');
const { ensureLeadWorkspaceOperator } = require('../utils/lead-workspace-operator');
const { ValidationError } = require('../utils/validation');

const sendError = (res, e) => {
  if (e instanceof ValidationError) {
    return res.status(400).json({ success: false, message: e.message });
  }
  // eslint-disable-next-line no-console
  console.error('[lead-workspace-proposals.controller] error:', e);
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

const parseProposalIdParam = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const raw = String(value).trim();
  if (raw.length === 0 || !/^\d+$/.test(raw)) {
    return null;
  }
  const proposalId = Number(raw);
  if (!Number.isSafeInteger(proposalId) || proposalId <= 0) {
    return null;
  }
  return proposalId;
};

const requireLeadIdParam = (req, res) => {
  const leadId = parseLeadIdParam(req.params.leadId);
  if (leadId == null) {
    res.status(400).json({ success: false, message: 'Lead ID tidak valid.' });
    return null;
  }
  return leadId;
};

const requireProposalIdParam = (req, res) => {
  const proposalId = parseProposalIdParam(req.params.proposalId);
  if (proposalId == null) {
    res.status(400).json({ success: false, message: 'Proposal ID tidak valid.' });
    return null;
  }
  return proposalId;
};

const getUserIdFromRequest = (req, res) => {
  const id = Number(req.user?.sub);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(401).json({ success: false, message: 'Token tidak berisi user ID yang valid.' });
    return null;
  }
  return id;
};

const parseBooleanField = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
    return false;
  }
  throw new ValidationError(`${fieldName} tidak valid.`);
};

const parseIssuerCompany = (value) => {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (normalized !== 'DSK' && normalized !== 'DTAX') {
    throw new ValidationError('Issuer Company harus DSK atau DTAX.');
  }
  return normalized;
};

const parsePayerParty = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }
  const normalized = String(value).trim().toUpperCase();
  if (normalized !== 'PARTNER' && normalized !== 'CLIENT') {
    throw new ValidationError('Payer Party harus PARTNER atau CLIENT.');
  }
  return normalized;
};

const parseMoney = (value, fieldName, { required = true, allowZero = false } = {}) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    if (!required) {
      return 0;
    }
    throw new ValidationError(`${fieldName} wajib diisi.`);
  }
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    throw new ValidationError(`${fieldName} tidak valid.`);
  }
  if (allowZero ? amount < 0 : amount <= 0) {
    throw new ValidationError(
      allowZero ? `${fieldName} tidak boleh negatif.` : `${fieldName} harus lebih besar dari 0.`
    );
  }
  return Math.round(amount * 100) / 100;
};

const parseServiceId = (value) => {
  const serviceId = Number(value);
  if (!Number.isSafeInteger(serviceId) || serviceId <= 0) {
    throw new ValidationError('Service wajib dipilih.');
  }
  return serviceId;
};

const parseOptionalPartnerName = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > 200) {
    throw new ValidationError('Partner Name maksimal 200 karakter.');
  }
  return trimmed;
};

const parseProposalAction = (value) => {
  const normalized = String(value ?? 'draft').trim().toLowerCase();
  if (normalized === 'draft' || normalized === 'submit') {
    return normalized;
  }
  throw new ValidationError('Action proposal tidak valid.');
};

const parseProposalPayload = (body) => {
  const isSubContract = parseBooleanField(body.is_sub_contract, 'Is Sub Contract');
  const partnerName = parseOptionalPartnerName(body.partner_name);
  const payerParty = parsePayerParty(body.payer_party);
  const proposalFee = parseMoney(body.proposal_fee, 'Proposal Fee');
  const discountAmount = parseMoney(body.discount_amount, 'Discount Amount', { required: false, allowZero: true });

  if (discountAmount > proposalFee) {
    throw new ValidationError('Discount tidak boleh melebihi Proposal Fee.');
  }

  if (isSubContract) {
    if (!partnerName) {
      throw new ValidationError('Partner Name wajib diisi untuk sub contract.');
    }
    if (!payerParty) {
      throw new ValidationError('Payer Party wajib dipilih untuk sub contract.');
    }
  }

  return {
    service_id: parseServiceId(body.service_id),
    issuer_company: parseIssuerCompany(body.issuer_company),
    is_sub_contract: isSubContract,
    partner_name: isSubContract ? partnerName : null,
    payer_party: isSubContract ? payerParty : null,
    proposal_fee: proposalFee,
    discount_amount: discountAmount
  };
};

const dbPathFromUploadedFile = (file) => {
  if (!file || !file.filename) return null;
  return `/uploads/proposals/${file.filename}`;
};

const fileMetaFromUploadedFile = (file) => {
  const filePath = dbPathFromUploadedFile(file);
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

const mapRepoFailure = (res, result) => {
  switch (result.reason) {
    case 'INVALID_LEAD_ID':
    case 'INVALID_ID':
      return res.status(400).json({ success: false, message: 'ID tidak valid.' });
    case 'NOT_FOUND':
      return res.status(404).json({ success: false, message: 'Lead tidak ditemukan.' });
    case 'PROPOSAL_EXISTS':
      return res.status(409).json({ success: false, message: 'Proposal untuk lead ini sudah ada.' });
    case 'SERVICE_NOT_FOUND':
      return res.status(400).json({ success: false, message: 'Service tidak ditemukan.' });
    case 'SERVICE_INACTIVE':
      return res.status(400).json({ success: false, message: 'Service tidak aktif.' });
    case 'PROPOSAL_NOT_FOUND':
      return res.status(404).json({ success: false, message: 'Proposal tidak ditemukan.' });
    case 'NOT_DRAFT':
      return res.status(409).json({ success: false, message: 'Proposal hanya dapat dihapus saat status Draft.' });
    case 'NOT_EDITABLE':
      return res.status(409).json({
        success: false,
        message: 'Proposal hanya dapat diubah saat status Draft atau Need Revision.'
      });
    case 'DOCUMENT_REQUIRED':
      return res.status(400).json({ success: false, message: 'Dokumen proposal wajib diunggah.' });
    case 'NOT_APPROVED':
      return res.status(409).json({
        success: false,
        message: 'Proposal hanya dapat dikirim ke client saat status Approved.'
      });
    case 'NOT_SENT':
      return res.status(409).json({
        success: false,
        message: 'Proposal hanya dapat ditandai direspons saat status Sent.'
      });
    default:
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getProposal = async (req, res) => {
  const leadId = requireLeadIdParam(req, res);
  if (leadId == null) return undefined;

  try {
    const result = await leadWorkspaceProposalsRepo.fetchLatestProposalForLead(leadId);
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.json({ success: true, data: { proposal: result.proposal } });
  } catch (e) {
    return sendError(res, e);
  }
};

const createProposal = async (req, res) => {
  const leadId = requireLeadIdParam(req, res);
  if (leadId == null) return undefined;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return undefined;
  if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) {
    return undefined;
  }

  try {
    const action = parseProposalAction(req.body.action);
    const payload = parseProposalPayload(req.body);
    const fileMeta = fileMetaFromUploadedFile(req.file);
    if (!fileMeta) {
      return res.status(400).json({ success: false, message: 'Dokumen proposal wajib diunggah.' });
    }

    const result = await leadWorkspaceProposalsRepo.createDraftProposal(leadId, payload, fileMeta, userId, {
      submit: action === 'submit'
    });
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.status(201).json({ success: true, data: { proposal: result.proposal } });
  } catch (e) {
    return sendError(res, e);
  }
};

const updateProposal = async (req, res) => {
  const leadId = requireLeadIdParam(req, res);
  if (leadId == null) return undefined;
  const proposalId = requireProposalIdParam(req, res);
  if (proposalId == null) return undefined;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return undefined;
  if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) {
    return undefined;
  }

  try {
    const action = parseProposalAction(req.body.action);
    const payload = parseProposalPayload(req.body);
    const fileMeta = fileMetaFromUploadedFile(req.file);
    const result = await leadWorkspaceProposalsRepo.updateDraftProposal(
      leadId,
      proposalId,
      payload,
      fileMeta,
      userId,
      { submit: action === 'submit' }
    );
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.json({ success: true, data: { proposal: result.proposal } });
  } catch (e) {
    return sendError(res, e);
  }
};

const deleteProposal = async (req, res) => {
  const leadId = requireLeadIdParam(req, res);
  if (leadId == null) return undefined;
  const proposalId = requireProposalIdParam(req, res);
  if (proposalId == null) return undefined;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return undefined;
  if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) {
    return undefined;
  }

  try {
    const result = await leadWorkspaceProposalsRepo.deleteDraftProposal(leadId, proposalId);
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.json({ success: true, data: { deleted: true } });
  } catch (e) {
    return sendError(res, e);
  }
};

const submitProposal = async (req, res) => {
  const leadId = requireLeadIdParam(req, res);
  if (leadId == null) return undefined;
  const proposalId = requireProposalIdParam(req, res);
  if (proposalId == null) return undefined;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return undefined;
  if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) {
    return undefined;
  }

  try {
    const result = await leadWorkspaceProposalsRepo.submitDraftProposal(leadId, proposalId, userId);
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.json({ success: true, data: { proposal: result.proposal } });
  } catch (e) {
    return sendError(res, e);
  }
};

const markProposalSent = async (req, res) => {
  const leadId = requireLeadIdParam(req, res);
  if (leadId == null) return undefined;
  const proposalId = requireProposalIdParam(req, res);
  if (proposalId == null) return undefined;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return undefined;
  if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) {
    return undefined;
  }

  try {
    const result = await leadWorkspaceProposalsRepo.markProposalSentToClient(leadId, proposalId, userId);
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.json({ success: true, data: { proposal: result.proposal } });
  } catch (e) {
    return sendError(res, e);
  }
};

const markProposalResponded = async (req, res) => {
  const leadId = requireLeadIdParam(req, res);
  if (leadId == null) return undefined;
  const proposalId = requireProposalIdParam(req, res);
  if (proposalId == null) return undefined;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return undefined;
  if (!(await ensureLeadWorkspaceOperator(leadId, userId, res))) {
    return undefined;
  }

  try {
    const result = await leadWorkspaceProposalsRepo.markProposalResponded(leadId, proposalId, userId);
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.json({ success: true, data: { proposal: result.proposal } });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  getProposal,
  createProposal,
  updateProposal,
  deleteProposal,
  submitProposal,
  markProposalSent,
  markProposalResponded
};
