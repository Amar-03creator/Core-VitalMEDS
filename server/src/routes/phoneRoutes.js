const express = require('express');
const router  = express.Router();
const { checkPhone } = require('../controllers/duplicateController');

// GET /api/phones/check?phone=9876543210
router.get('/check', checkPhone);

module.exports = router;