const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const { list, createManual, markLost } = require('../controllers/lead-tracker.controller');

const viewStack = [authenticate, requirePermission('LEAD_TRACKER_VIEW')];
const manageStack = [authenticate, requirePermission('LEAD_MANAGE')];

const router = express.Router();

router.get('/', ...viewStack, list);
router.post('/manual', ...manageStack, createManual);
router.post('/:leadId/mark-lost', ...manageStack, markLost);

module.exports = router;
