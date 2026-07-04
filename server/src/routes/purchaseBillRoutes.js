const express = require('express');
const router = express.Router();
const {
    createPurchaseBill,
    getAllPurchaseBills,
    getPurchaseBillsBySupplier,
    getPurchaseBillById,
    recordPurchasePayment,
    cancelPurchaseBill,
} = require('../controllers/purchaseBillController');

// POST /api/purchase-bills                       -> create (existing)
// GET  /api/purchase-bills                       -> list all (existing)
router.post('/', createPurchaseBill);
router.get('/', getAllPurchaseBills);

// GET  /api/purchase-bills/supplier/:supplierId  -> ★ NEW, powers Purchase Bills tab
router.get('/supplier/:supplierId', getPurchaseBillsBySupplier);

// POST /api/purchase-bills/payments              -> ★ NEW, FIFO payment against a supplier's bills
router.post('/payments', recordPurchasePayment);

// GET  /api/purchase-bills/:id                   -> ★ NEW, single bill detail
router.get('/:id', getPurchaseBillById);

// PATCH /api/purchase-bills/:id/cancel           -> ★ NEW, void + restock reversal
router.patch('/:id/cancel', cancelPurchaseBill);

module.exports = router;