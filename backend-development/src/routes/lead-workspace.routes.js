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
const {
  getProposal,
  createProposal,
  updateProposal,
  deleteProposal,
  submitProposal,
  markProposalSent,
  markProposalResponded
} = require('../controllers/lead-workspace-proposals.controller');
const {
  getEngagementLetterBundle,
  createDraftEngagementLetter,
  updateDraftEngagementLetter,
  deleteDraftEngagementLetter,
  submitEngagementLetter,
  markEngagementLetterSentToClient,
  markEngagementLetterSigned
} = require('../controllers/lead-workspace-engagements.controller');
const {
  uploadEngagementLetterDocument,
  uploadOptionalEngagementLetterDocument
} = require('../middleware/upload-engagement-letter-document');
const {
  uploadProposalDocument,
  uploadOptionalProposalDocument
} = require('../middleware/upload-proposal-document');

const viewStack = [authenticate, requirePermission('LEAD_VIEW')];
const manageStack = [authenticate, requirePermission('LEAD_MANAGE')];

const router = express.Router();

router.get('/:leadId/proposal', ...viewStack, getProposal);
router.post('/:leadId/proposal', ...manageStack, uploadProposalDocument, createProposal);
router.patch('/:leadId/proposal/:proposalId', ...manageStack, uploadOptionalProposalDocument, updateProposal);
router.delete('/:leadId/proposal/:proposalId', ...manageStack, deleteProposal);
router.post('/:leadId/proposal/:proposalId/submit', ...manageStack, submitProposal);
router.post('/:leadId/proposal/:proposalId/sent', ...manageStack, markProposalSent);
router.post('/:leadId/proposal/:proposalId/responded', ...manageStack, markProposalResponded);

router.get('/:leadId/meetings', ...viewStack, listMeetings);
router.post('/:leadId/meetings', ...manageStack, createMeeting);
router.patch('/:leadId/meetings/:meetingId/complete', ...manageStack, completeMeeting);
router.patch('/:leadId/meetings/:meetingId', ...manageStack, updateMeeting);
router.get('/:leadId/meetings/:meetingId/minutes', ...viewStack, getMinutes);
router.post('/:leadId/meetings/:meetingId/minutes', ...manageStack, createMinutes);
router.patch('/:leadId/meetings/:meetingId/minutes', ...manageStack, updateMinutes);

router.get('/:leadId/engagement-letter', ...viewStack, getEngagementLetterBundle);
router.post('/:leadId/engagement-letter', ...manageStack, uploadEngagementLetterDocument, createDraftEngagementLetter);
router.patch(
  '/:leadId/engagement-letter/:engagementId',
  ...manageStack,
  uploadOptionalEngagementLetterDocument,
  updateDraftEngagementLetter
);
router.delete('/:leadId/engagement-letter/:engagementId', ...manageStack, deleteDraftEngagementLetter);
router.post('/:leadId/engagement-letter/:engagementId/submit', ...manageStack, submitEngagementLetter);
router.post('/:leadId/engagement-letter/:engagementId/sent', ...manageStack, markEngagementLetterSentToClient);
router.post('/:leadId/engagement-letter/:engagementId/signed', ...manageStack, markEngagementLetterSigned);

router.get('/:leadId', ...viewStack, getDetail);
router.patch('/:leadId/details', ...manageStack, updateDetails);

module.exports = router;
