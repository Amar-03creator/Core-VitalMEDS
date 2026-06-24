const express = require('express');
const router = express.Router();
const productBatchController = require('../controllers/productBatchController');

router.get('/', productBatchController.getProductsWithBatches);

module.exports = router;