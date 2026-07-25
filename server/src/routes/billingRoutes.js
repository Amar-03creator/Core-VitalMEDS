// server/src/routes/billingRoutes.js
const express = require('express');
const router = express.Router();
const { getBillingSummary, getClientMonthlySummary } = require('../controllers/billingController');
const { authenticate } = require('../middleware/authMiddleware');

// GET /api/billing/summary -> (High-level totals for the dashboard)
router.get('/summary', authenticate, getBillingSummary);

// GET /api/billing/monthly-summary/:clientId -> (Month-by-month ledger for charts/tables)
router.get('/monthly-summary/:clientId', authenticate, getClientMonthlySummary);

module.exports = router;