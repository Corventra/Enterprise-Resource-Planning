const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/require-role');
const { list } = require('../controllers/meetings-monitor.controller');

const monitorStack = [authenticate, requireRole(['CEO', 'BD'])];

const router = express.Router();

router.get('/', ...monitorStack, list);

module.exports = router;
