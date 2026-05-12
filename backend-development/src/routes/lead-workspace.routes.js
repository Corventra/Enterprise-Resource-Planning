const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const { getDetail, updateDetails } = require('../controllers/lead-workspace.controller');

const viewStack = [authenticate, requirePermission('LEAD_VIEW')];
const manageStack = [authenticate, requirePermission('LEAD_MANAGE')];

const router = express.Router();

router.get('/:leadId', ...viewStack, getDetail);
router.patch('/:leadId/details', ...manageStack, updateDetails);

module.exports = router;
