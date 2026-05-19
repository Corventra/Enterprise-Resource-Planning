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
  getProjectHandover
} = require('../controllers/projects.controller');

const viewStack = [authenticate, requirePermission('PROJECT_VIEW')];
const assignPmStack = [authenticate, requirePermission('PROJECT_ASSIGN_PM')];
const assignConsultantStack = [authenticate, requirePermission('PROJECT_ASSIGN_CONSULTANT')];
const updateProgressStack = [authenticate, requirePermission('PROJECT_UPDATE_PROGRESS')];
const rateTaskStack = [authenticate, requirePermission('KPI_RATE_TASK')];

const router = express.Router();

router.get('/', ...viewStack, listProjects);
router.get('/:projectId', ...viewStack, getProjectDetail);
router.get('/:projectId/handover', ...viewStack, getProjectHandover);
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

module.exports = router;
