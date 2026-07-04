// server/src/routes/productBatchRoutes.js
const express = require('express');
const router = express.Router();
const productBatchController = require('../controllers/productBatchController');

// 1. The original PDF export route
router.get('/', productBatchController.getProductsWithBatches);

// 2. The new Advanced Inventory route
router.get('/inventory', productBatchController.getInventory);

// 3. The PTR update route for a specific batch
router.put('/batches/:id/ptr', productBatchController.updateBatchPTR);

module.exports = router;