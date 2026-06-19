const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/require-role');
const { requirePermissionOrRole } = require('../middleware/require-permission');
const { getCeoDashboard } = require('../controllers/dashboard-ceo.controller');
const { getBdDashboard } = require('../controllers/dashboard-bd.controller');
const { getMeoDashboard } = require('../controllers/dashboard-meo.controller');
const { getStaffAdminDashboard } = require('../controllers/dashboard-staff-admin.controller');
const { getCooDashboard } = require('../controllers/dashboard-coo.controller');
const { getPmDashboard } = require('../controllers/dashboard-pm.controller');
const { getConsultantDashboard } = require('../controllers/dashboard-consultant.controller');
const { requireBdDashboardVariant } = require('../utils/dashboard-bd-access');

// Dashboard CEO: permission-based gating (TC-25) + role fallback.
// DASHBOARD_CEO_VIEW di-grant ke CEO + SUPERADMIN via permission-map.
// Fallback role dipakai supaya user CEO/SUPERADMIN dengan JWT yang dicetak sebelum
// migration 018 tetap bisa akses tanpa harus logout/login terlebih dahulu.
const ceoStack = [authenticate, requirePermissionOrRole('DASHBOARD_CEO_VIEW', ['CEO', 'SUPERADMIN'])];
/** Role BD + department utama bukan MEO → pipeline */
const bdPipelineStack = [authenticate, requireRole(['BD']), requireBdDashboardVariant('pipeline')];
/** Role BD + department utama MEO → marketing */
const bdMarketingStack = [authenticate, requireRole(['BD']), requireBdDashboardVariant('marketing')];
const staffAdminStack = [authenticate, requireRole(['STAFF_ADMIN'])];
const cooStack = [authenticate, requireRole(['COO', 'SUPERADMIN'])];
const pmStack = [authenticate, requireRole(['PM', 'SUPERADMIN'])];
const consultantStack = [authenticate, requireRole(['CONSULTANT', 'SUPERADMIN'])];

const router = express.Router();

router.get('/ceo', ...ceoStack, getCeoDashboard);
router.get('/coo', ...cooStack, getCooDashboard);
router.get('/pm', ...pmStack, getPmDashboard);
router.get('/consultant', ...consultantStack, getConsultantDashboard);
router.get('/bd', ...bdPipelineStack, getBdDashboard);
router.get('/meo', ...bdMarketingStack, getMeoDashboard);
router.get('/staff-admin', ...staffAdminStack, getStaffAdminDashboard);

module.exports = router;
