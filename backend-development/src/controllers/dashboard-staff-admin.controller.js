const dashboardStaffAdminRepo = require('../repositories/dashboard-staff-admin.repo');

const getStaffAdminDashboard = async (req, res) => {
  try {
    const result = await dashboardStaffAdminRepo.getStaffAdminDashboard(req.query);
    if (!result.ok) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Gagal memuat dashboard Staff Administrasi.'
      });
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    if (e instanceof Error && e.message.includes('Rentang custom')) {
      return res.status(400).json({ success: false, message: e.message });
    }
    // eslint-disable-next-line no-console
    console.error('[dashboard-staff-admin.controller] error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getStaffAdminDashboard
};
