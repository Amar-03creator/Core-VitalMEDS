const express = require('express');
const router = express.Router();
const paymentReceiptController = require('../controllers/paymentReceiptController');

// Create a new payment receipt
router.post('/', paymentReceiptController.createPaymentReceipt);

// Reconcile a payment receipt (allocate it to invoices)
router.post('/reconcile/:clientObjectId', paymentReceiptController.reconcileClientLedger);

// Get all payment receipts for a client
// router.get('/client/:clientId', paymentReceiptController.getPaymentReceiptsByClient);

module.exports = router;