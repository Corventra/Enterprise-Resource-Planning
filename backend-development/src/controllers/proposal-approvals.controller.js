const proposalApprovalsRepo = require('../repositories/proposal-approvals.repo');

const sendError = (res, e) => {
  // eslint-disable-next-line no-console
  console.error('[proposal-approvals.controller] error:', e);
  return res.status(500).json({ success: false, message: 'Internal server error' });
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

const mapRepoFailure = (res, result) => {
  switch (result.reason) {
    case 'INVALID_PROPOSAL_ID':
      return res.status(400).json({ success: false, message: 'Proposal ID tidak valid.' });
    case 'NOTE_REQUIRED':
      return res.status(400).json({ success: false, message: 'Revision note wajib diisi.' });
    case 'NOT_FOUND':
      return res.status(404).json({ success: false, message: 'Proposal tidak ditemukan.' });
    case 'NOT_PENDING':
      return res.status(409).json({ success: false, message: 'Proposal tidak sedang menunggu approval CEO.' });
    case 'APPROVAL_NOT_FOUND':
      return res.status(409).json({ success: false, message: 'Approval proposal tidak ditemukan atau sudah diputuskan.' });
    case 'APPROVAL_ALREADY_DECIDED':
      return res.status(409).json({ success: false, message: 'Approval proposal sudah diputuskan.' });
    default:
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const listPending = async (req, res) => {
  try {
    const result = await proposalApprovalsRepo.listPendingProposals();
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.json({ success: true, data: { items: result.items } });
  } catch (e) {
    return sendError(res, e);
  }
};

const getDetail = async (req, res) => {
  const proposalId = requireProposalIdParam(req, res);
  if (proposalId == null) return;

  try {
    const result = await proposalApprovalsRepo.getPendingProposalDetail(proposalId);
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.json({
      success: true,
      data: {
        proposal: result.proposal,
        approval: result.approval,
        lead_summary: result.lead_summary
      }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

const approve = async (req, res) => {
  const proposalId = requireProposalIdParam(req, res);
  if (proposalId == null) return;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return;

  try {
    const result = await proposalApprovalsRepo.approveProposal(proposalId, userId);
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.json({ success: true, data: { proposal: result.proposal } });
  } catch (e) {
    return sendError(res, e);
  }
};

const reject = async (req, res) => {
  const proposalId = requireProposalIdParam(req, res);
  if (proposalId == null) return;
  const userId = getUserIdFromRequest(req, res);
  if (userId == null) return;

  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
  if (!note) {
    return res.status(400).json({ success: false, message: 'Revision note wajib diisi.' });
  }

  try {
    const result = await proposalApprovalsRepo.rejectProposal(proposalId, note, userId);
    if (!result.ok) {
      return mapRepoFailure(res, result);
    }
    return res.json({ success: true, data: { proposal: result.proposal } });
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
