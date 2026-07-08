// server/src/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.createOrder);
router.post('/convert', orderController.convertInquiryToOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id/cancel', orderController.cancelOrder);
router.put('/:id/ship', orderController.shipOrder);
router.put('/:id/deliver', orderController.confirmDelivery);

module.exports = router;

// Mount in your app entry:
//   app.use('/api/orders', require('./src/routes/orderRoutes'));