// server/src/routes/ledgerRoutes.js
const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');

router.get('/', ledgerController.getLedger);
module.exports = router;