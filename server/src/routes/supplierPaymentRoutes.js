const express = require('express');
const router = express.Router();
const supplierPaymentController = require('../controllers/supplierPaymentController');

// ✨ FIX: Correctly import 'authenticate' and 'requireAdmin' from your exact folder path
const { authenticate, requireAdmin } = require('../middleware/authMiddleware'); 

// Get all supplier payments
router.get('/', authenticate, requireAdmin, supplierPaymentController.getAllSupplierPayments);

// Create a new supplier payment (FIFO allocation)
router.post('/', authenticate, requireAdmin, supplierPaymentController.createSupplierPayment);

// Delete/Reverse a supplier payment
router.delete('/:id', authenticate, requireAdmin, supplierPaymentController.deleteSupplierPayment);

// Force-reconcile a specific supplier's ledger
router.post('/reconcile/:supplierObjectId', authenticate, requireAdmin, supplierPaymentController.reconcileSupplierLedger);

module.exports = router;