const dashboardCooRepo = require('../repositories/dashboard-coo.repo');

const getCooDashboard = async (req, res) => {
  try {
    const result = await dashboardCooRepo.getCooDashboard(req.query, req.user);
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message || 'Gagal memuat dashboard COO.' });
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    if (e instanceof Error && e.message.includes('Rentang custom')) {
      return res.status(400).json({ success: false, message: e.message });
    }
    // eslint-disable-next-line no-console
    console.error('[dashboard-coo.controller] error:', e);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      detail: e?.sqlMessage || e?.message
    });
  }
};

module.exports = { getCooDashboard };
