const campaignsRepo = require('../repositories/campaigns.repo');
const formsRepo = require('../repositories/forms.repo');
const submissionsRepo = require('../repositories/submissions.repo');
const { ValidationError } = require('../utils/validation');

const sendError = (res, e) => {
  if (e instanceof ValidationError) {
    return res.status(400).json({ success: false, message: e.message });
  }
  // eslint-disable-next-line no-console
  console.error('[submissions.controller] error:', e);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const requirePositiveInt = (value, fieldName) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ValidationError(`${fieldName} harus bilangan bulat positif.`);
  }
  return n;
};

const listByForm = async (req, res) => {
  try {
    const formId = requirePositiveInt(req.params.id, 'Form ID');
    const form = await formsRepo.findById(formId);
    if (!form) {
      return res.status(404).json({ success: false, message: 'Form tidak ditemukan.' });
    }
    const submissions = await submissionsRepo.listSubmissionsByFormId(formId);
    return res.json({ success: true, data: { submissions } });
  } catch (e) {
    return sendError(res, e);
  }
};

const getDetail = async (req, res) => {
  try {
    const formId = requirePositiveInt(req.params.id, 'Form ID');
    const submissionId = requirePositiveInt(req.params.submissionId, 'Submission ID');
    const form = await formsRepo.findById(formId);
    if (!form) {
      return res.status(404).json({ success: false, message: 'Form tidak ditemukan.' });
    }
    const detail = await submissionsRepo.findSubmissionByIdForForm(formId, submissionId);
    if (!detail) {
      return res.status(404).json({ success: false, message: 'Submission tidak ditemukan.' });
    }
    return res.json({ success: true, data: detail });
  } catch (e) {
    return sendError(res, e);
  }
};

const countByCampaign = async (req, res) => {
  try {
    const campaignId = requirePositiveInt(req.params.campaignId, 'Campaign ID');
    const campaign = await campaignsRepo.findByIdWithJoins(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign tidak ditemukan.' });
    }
    const totalSubmissions = await submissionsRepo.countSubmissionsByCampaignId(campaignId);
    return res.json({ success: true, data: { total_submissions: totalSubmissions } });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  listByForm,
  getDetail,
  countByCampaign
};
