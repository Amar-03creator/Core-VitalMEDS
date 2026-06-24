const express = require('express');
const router  = express.Router();
const { checkDuplicate, checkPhone } = require('../controllers/duplicateController');

// GET /api/duplicates/check?field=gstin&value=27AAPFU0939F1ZV
router.get('/check', checkDuplicate);

module.exports = router;