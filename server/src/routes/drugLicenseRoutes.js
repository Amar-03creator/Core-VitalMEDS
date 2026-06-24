const express = require('express');
const router = express.Router();
const drugLicenseController = require('../controllers/drugLicenseController');

router.get('/check', drugLicenseController.checkDrugLicense);

module.exports = router;