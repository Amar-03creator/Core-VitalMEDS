const express = require('express');
const router = express.Router();
const {
    generateSuggestions,
    exportPurchaseOrders,
} = require('../controllers/replenishmentController');

// POST /api/replenishment/suggestions   -> compute suggested reorder quantities
router.post('/suggestions', generateSuggestions);


module.exports = router;