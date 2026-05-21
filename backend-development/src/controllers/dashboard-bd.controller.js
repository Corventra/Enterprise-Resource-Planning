const dashboardBdRepo = require('../repositories/dashboard-bd.repo');

const getBdDashboard = async (req, res) => {
  try {
    const result = await dashboardBdRepo.getBdDashboard(req.query, req.user?.sub);
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message || 'Gagal memuat dashboard BD.' });
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    if (e instanceof Error && e.message.includes('Rentang custom')) {
      return res.status(400).json({ success: false, message: e.message });
    }
    // eslint-disable-next-line no-console
    console.error('[dashboard-bd.controller] error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getBdDashboard
};
