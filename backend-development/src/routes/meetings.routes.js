const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requireMeetingsMonitorAccess } = require('../utils/meetings-monitor-access');
const { list } = require('../controllers/meetings-monitor.controller');

const monitorStack = [authenticate, requireMeetingsMonitorAccess];

const router = express.Router();

router.get('/', ...monitorStack, list);

module.exports = router;
