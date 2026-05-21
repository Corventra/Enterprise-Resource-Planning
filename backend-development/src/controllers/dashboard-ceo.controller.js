const dashboardCeoRepo = require('../repositories/dashboard-ceo.repo');

const getCeoDashboard = async (req, res) => {
  try {
    const result = await dashboardCeoRepo.getCeoDashboard(req.query);
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message || 'Gagal memuat dashboard CEO.' });
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    if (e instanceof Error && e.message.includes('Rentang custom')) {
      return res.status(400).json({ success: false, message: e.message });
    }
    // eslint-disable-next-line no-console
    console.error('[dashboard-ceo.controller] error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getCeoDashboard
};
