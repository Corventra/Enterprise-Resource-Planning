const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const { list, getDetail, process, archive } = require('../controllers/bank-data.controller');

const viewStack = [authenticate, requirePermission('BANK_DATA_VIEW')];
const processStack = [authenticate, requirePermission('BANK_DATA_PROCESS')];

const router = express.Router();

router.get('/', ...viewStack, list);
router.get('/:leadId', ...viewStack, getDetail);
router.post('/:leadId/process', ...processStack, process);
router.post('/:leadId/archive', ...processStack, archive);

module.exports = router;
