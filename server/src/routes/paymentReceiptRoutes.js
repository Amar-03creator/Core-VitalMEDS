const express = require('express');
const router = express.Router();
const paymentReceiptController = require('../controllers/paymentReceiptController');

// Create a new payment receipt
router.post('/', paymentReceiptController.createPaymentReceipt);

// Reconcile a payment receipt (allocate it to invoices)
router.post('/reconcile/:clientObjectId', paymentReceiptController.reconcileClientLedger);

// Get all payment receipts (for admin overview)
router.get('/', paymentReceiptController.getAllPaymentReceipts);

// ★ ADDED HERE: Edit and Delete routes
router.put('/:id', paymentReceiptController.updatePaymentReceipt);
router.delete('/:id', paymentReceiptController.deletePaymentReceipt);

module.exports = router;