const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { listRoles, listDepartments } = require('../controllers/lookup.controller');

const router = express.Router();

// Lookup = authenticated user manapun (untuk populate dropdown form).
router.use(authenticate);

router.get('/roles', listRoles);
router.get('/departments', listDepartments);

module.exports = router;
