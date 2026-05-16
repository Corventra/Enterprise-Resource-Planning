const express = require('express');
const { getPublicForm, submitPublicForm } = require('../controllers/public-forms.controller');
const { uploadPublicFormSubmissionFiles } = require('../middleware/upload-public-form-submission');

const router = express.Router();

router.post('/:linkCode/submit', uploadPublicFormSubmissionFiles, submitPublicForm);
router.get('/:linkCode', getPublicForm);

module.exports = router;
