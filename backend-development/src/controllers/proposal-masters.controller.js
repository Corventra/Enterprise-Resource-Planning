const proposalMastersRepo = require('../repositories/proposal-masters.repo');

const sendError = (res, e) => {
  // eslint-disable-next-line no-console
  console.error('[proposal-masters.controller] error:', e);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const listServiceClasses = async (_req, res) => {
  try {
    const items = await proposalMastersRepo.listServiceClasses();
    return res.json({ success: true, data: { items } });
  } catch (e) {
    return sendError(res, e);
  }
};

const listServices = async (_req, res) => {
  try {
    const items = await proposalMastersRepo.listServices();
    return res.json({ success: true, data: { items } });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  listServiceClasses,
  listServices
};
