const {
  fetchPrimaryDepartmentCode,
  BD_DEPARTMENT_EXECUTIVE
} = require('./dashboard-bd-access');

const MEETINGS_MONITOR_MESSAGE =
  'Akses halaman Meeting hanya untuk CEO dan BD dengan department Executive.';

/**
 * CEO = semua meeting. BD = hanya jika department utama EXECUTIVE.
 */
const assertMeetingsMonitorAccess = async (req, res) => {
  const role = String(req.user?.role ?? '')
    .trim()
    .toUpperCase();

  if (role === 'CEO') {
    return true;
  }

  if (role !== 'BD') {
    res.status(403).json({ success: false, message: MEETINGS_MONITOR_MESSAGE });
    return false;
  }

  const primaryCode = await fetchPrimaryDepartmentCode(req.user.sub);
  if (primaryCode === BD_DEPARTMENT_EXECUTIVE) {
    return true;
  }

  res.status(403).json({
    success: false,
    message: MEETINGS_MONITOR_MESSAGE
  });
  return false;
};

const requireMeetingsMonitorAccess = async (req, res, next) => {
  try {
    const allowed = await assertMeetingsMonitorAccess(req, res);
    if (!allowed) return undefined;
    return next();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[meetings-monitor-access] error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  MEETINGS_MONITOR_MESSAGE,
  assertMeetingsMonitorAccess,
  requireMeetingsMonitorAccess
};
