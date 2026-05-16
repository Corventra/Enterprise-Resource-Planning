const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const {
  listServiceClasses,
  listServices
} = require('../controllers/proposal-masters.controller');

const viewStack = [authenticate, requirePermission('LEAD_VIEW')];

const router = express.Router();

router.get('/service-classes', ...viewStack, listServiceClasses);
router.get('/services', ...viewStack, listServices);

module.exports = router;
