const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');

// In the future, AWS EventBridge will hit this endpoint automatically
router.post('/run', auditController.runFullSystemAudit);

module.exports = router;