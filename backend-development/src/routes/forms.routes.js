const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const { uploadFormHeaderImage } = require('../middleware/upload-form-header-image');
const {
  listByForm,
  getDetail: getSubmissionDetail,
  countByCampaign
} = require('../controllers/submissions.controller');
const {
  listByCampaign,
  createDraft,
  getDetail,
  patchForm,
  addField,
  patchField,
  deleteField,
  addOption,
  patchOption,
  deleteOption,
  publishForm,
  getLinks,
  pauseResponses,
  resumeResponses,
  deactivateForm,
  deleteDraftForm
} = require('../controllers/forms.controller');

const FORM_VIEW_ANY = ['FORM_VIEW', 'FORM_MANAGE'];
const FORM_MANAGE = 'FORM_MANAGE';

const viewStack = [authenticate, requirePermission(FORM_VIEW_ANY, 'any')];
const manageStack = [authenticate, requirePermission(FORM_MANAGE)];

const campaignFormsRouter = express.Router();
campaignFormsRouter.get('/:campaignId/submissions/count', ...viewStack, countByCampaign);
campaignFormsRouter.get('/:campaignId/forms', ...viewStack, listByCampaign);
campaignFormsRouter.post('/:campaignId/forms', ...manageStack, uploadFormHeaderImage, createDraft);

const formBuilderRouter = express.Router();
formBuilderRouter.post('/:id/publish', ...manageStack, publishForm);
formBuilderRouter.post('/:id/pause-responses', ...manageStack, pauseResponses);
formBuilderRouter.post('/:id/resume-responses', ...manageStack, resumeResponses);
formBuilderRouter.post('/:id/deactivate', ...manageStack, deactivateForm);
formBuilderRouter.delete('/:id', ...manageStack, deleteDraftForm);
formBuilderRouter.get('/:id/submissions', ...viewStack, listByForm);
formBuilderRouter.get('/:id/submissions/:submissionId', ...viewStack, getSubmissionDetail);
formBuilderRouter.get('/:id/links', ...viewStack, getLinks);
formBuilderRouter.get('/:id', ...viewStack, getDetail);
formBuilderRouter.patch('/:id', ...manageStack, uploadFormHeaderImage, patchForm);
formBuilderRouter.post('/:id/fields', ...manageStack, addField);
formBuilderRouter.patch('/:id/fields/:fieldId', ...manageStack, patchField);
formBuilderRouter.delete('/:id/fields/:fieldId', ...manageStack, deleteField);

const fieldOptionsRouter = express.Router();
fieldOptionsRouter.post('/:fieldId/options', ...manageStack, addOption);
fieldOptionsRouter.patch('/:fieldId/options/:optionId', ...manageStack, patchOption);
fieldOptionsRouter.delete('/:fieldId/options/:optionId', ...manageStack, deleteOption);

module.exports = {
  campaignFormsRouter,
  formBuilderRouter,
  fieldOptionsRouter
};
