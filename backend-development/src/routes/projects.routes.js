const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const {
  listProjects,
  getProjectDetail,
  createFromHandover,
  assignConsultants,
  setConsultants,
  updateMilestoneStatus,
  rateMilestone,
  completeProject,
  pauseProject,
  resumeProject,
  cancelProject,
  getProjectHandover,
  getProjectAuditTrail
} = require('../controllers/projects.controller');

const viewStack = [authenticate, requirePermission('PROJECT_VIEW')];
const assignPmStack = [authenticate, requirePermission('PROJECT_ASSIGN_PM')];
const assignConsultantStack = [authenticate, requirePermission('PROJECT_ASSIGN_CONSULTANT')];
const updateProgressStack = [authenticate, requirePermission('PROJECT_UPDATE_PROGRESS')];
const manageStatusStack = [authenticate, requirePermission('PROJECT_MANAGE_STATUS')];
const rateTaskStack = [authenticate, requirePermission('KPI_RATE_TASK')];

const router = express.Router();

router.get('/', ...viewStack, listProjects);
router.get('/:projectId', ...viewStack, getProjectDetail);
router.get('/:projectId/handover', ...viewStack, getProjectHandover);
// WFMS audit trail — gabungan project + milestone history (Timeline tab)
router.get('/:projectId/audit-trail', ...viewStack, getProjectAuditTrail);
router.post('/from-handover/:handoverId', ...assignPmStack, createFromHandover);
router.post('/:projectId/consultants', ...assignConsultantStack, assignConsultants);
router.put('/:projectId/consultants', ...assignConsultantStack, setConsultants);
router.patch(
  '/:projectId/milestones/:milestoneId/status',
  ...updateProgressStack,
  updateMilestoneStatus
);
router.patch(
  '/:projectId/milestones/:milestoneId/rate',
  ...rateTaskStack,
  rateMilestone
);
// Mark Completed — PM action; trigger ke modul Invoice. Pakai
// PROJECT_UPDATE_PROGRESS (sama dengan milestone update) supaya PM eligible
// tanpa permission baru.
router.post('/:projectId/complete', ...updateProgressStack, completeProject);

// Lifecycle endpoints (UC "Mengelola Status Project") — semua pakai permission
// PROJECT_MANAGE_STATUS yang granted ke COO + PM + SUPERADMIN. WFMS authorization
// di service layer melakukan gate tambahan (ownership PM-of-project).
router.post('/:projectId/pause', ...manageStatusStack, pauseProject);
router.post('/:projectId/resume', ...manageStatusStack, resumeProject);
router.post('/:projectId/cancel', ...manageStatusStack, cancelProject);

module.exports = router;
