const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const { uploadCampaignImage } = require('../middleware/upload-campaign-image');
const {
  listTypes,
  listTopics,
  list,
  detail,
  create,
  update,
  archive
} = require('../controllers/campaigns.controller');

const CAN_VIEW_CAMPAIGNS = ['CAMPAIGN_VIEW', 'CAMPAIGN_MANAGE'];

const router = express.Router();

const viewStack = [authenticate, requirePermission(CAN_VIEW_CAMPAIGNS, 'any')];
const manageStack = [authenticate, requirePermission('CAMPAIGN_MANAGE')];

router.get('/types', ...viewStack, listTypes);
router.get('/topics', ...viewStack, listTopics);
router.get('/', ...viewStack, list);
router.post('/', ...manageStack, uploadCampaignImage, create);

router.patch('/:id/archive', ...manageStack, archive);
router.patch('/:id', ...manageStack, uploadCampaignImage, update);
router.get('/:id', ...viewStack, detail);

module.exports = router;
