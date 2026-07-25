const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// ✨ FIX: Import the exact function names exported by authMiddleware.js
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/', orderController.createOrder);
router.post('/convert', orderController.convertInquiryToOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.get('/:id/invoice/pdf', orderController.downloadInvoicePdf);   // Invoice PDF download

// Client editing
router.post('/:id/start-edit', orderController.startEditOrder);
router.post('/:id/cancel-edit', orderController.cancelEditOrder);
router.put('/:id', orderController.updateOrder);

// Admin lifecycle
router.put('/:id/confirm', orderController.confirmOrder);
router.put('/:id/cancel', orderController.cancelOrder);
router.put('/:id/cancel-invoice', orderController.cancelInvoice);     // Void invoice, revert to Confirmed
router.put('/:id/ship', orderController.shipOrder);
router.put('/:id/deliver', orderController.confirmDelivery);
router.put('/:id/share-pricing', orderController.sharePricing);       // Reveal itemised pricing to client

// ✨ NEW: Pack Order Route. 
// Uses authenticate to check the token, and authorize('admin') to check the role.
router.put('/:id/pack', authenticate, authorize('admin'), orderController.packOrder);

module.exports = router;