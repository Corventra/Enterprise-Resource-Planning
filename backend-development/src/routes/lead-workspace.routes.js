const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const { getDetail, updateDetails } = require('../controllers/lead-workspace.controller');
const {
  listMeetings,
  createMeeting,
  completeMeeting,
  updateMeeting,
  getMinutes,
  createMinutes,
  updateMinutes
} = require('../controllers/lead-workspace-meetings.controller');

const viewStack = [authenticate, requirePermission('LEAD_VIEW')];
const manageStack = [authenticate, requirePermission('LEAD_MANAGE')];

const router = express.Router();

router.get('/:leadId/meetings', ...viewStack, listMeetings);
router.post('/:leadId/meetings', ...manageStack, createMeeting);
router.patch('/:leadId/meetings/:meetingId/complete', ...manageStack, completeMeeting);
router.patch('/:leadId/meetings/:meetingId', ...manageStack, updateMeeting);
router.get('/:leadId/meetings/:meetingId/minutes', ...viewStack, getMinutes);
router.post('/:leadId/meetings/:meetingId/minutes', ...manageStack, createMinutes);
router.patch('/:leadId/meetings/:meetingId/minutes', ...manageStack, updateMinutes);

router.get('/:leadId', ...viewStack, getDetail);
router.patch('/:leadId/details', ...manageStack, updateDetails);

module.exports = router;
