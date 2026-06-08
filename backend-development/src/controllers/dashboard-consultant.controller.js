const dashboardConsultantRepo = require('../repositories/dashboard-consultant.repo');

const getConsultantDashboard = async (req, res) => {
  try {
    const result = await dashboardConsultantRepo.getConsultantDashboard(req.query, req.user);
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message || 'Gagal memuat dashboard Consultant.' });
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    if (e instanceof Error && e.message.includes('Rentang custom')) {
      return res.status(400).json({ success: false, message: e.message });
    }
    // eslint-disable-next-line no-console
    console.error('[dashboard-consultant.controller] error:', e);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      detail: e?.sqlMessage || e?.message
    });
  }
};

module.exports = { getConsultantDashboard };
