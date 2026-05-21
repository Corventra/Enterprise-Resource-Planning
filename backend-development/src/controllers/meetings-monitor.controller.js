const meetingsMonitorRepo = require('../repositories/meetings-monitor.repo');
const { ValidationError } = require('../utils/validation');

const sendError = (res, e) => {
  if (e instanceof ValidationError) {
    return res.status(400).json({ success: false, message: e.message });
  }
  // eslint-disable-next-line no-console
  console.error('[meetings-monitor.controller] error:', e);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const getUserIdFromRequest = (req, res) => {
  const id = Number(req.user?.sub);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(401).json({ success: false, message: 'Token tidak berisi user ID yang valid.' });
    return null;
  }
  return id;
};

const parseSummaryProcessedByOverride = (req) => {
  const raw = req.query.summary_processed_by;
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return null;
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('summary_processed_by harus bilangan bulat positif.');
  }
  return id;
};

const resolveScope = (req, userId) => {
  const role = String(req.user?.role ?? '')
    .trim()
    .toUpperCase();
  if (role === 'BD') {
    return { processedByUserId: userId, scope: 'own_leads' };
  }
  const override = parseSummaryProcessedByOverride(req);
  if (override != null) {
    return { processedByUserId: override, scope: 'filtered_user', summary_processed_by: override };
  }
  return { processedByUserId: null, scope: 'organization' };
};

const list = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;

    const scope = resolveScope(req, userId);

    const [items, summary] = await Promise.all([
      meetingsMonitorRepo.listMeetingsForScope(scope.processedByUserId),
      meetingsMonitorRepo.getMeetingsSummary(scope.processedByUserId)
    ]);

    const meta = {
      scope: scope.scope,
      ...(scope.summary_processed_by != null ? { summary_processed_by: scope.summary_processed_by } : {})
    };

    return res.json({
      success: true,
      data: { items, summary, meta }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  list
};
