// src/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate, requireClient } = require('../middleware/authMiddleware');

router.use(authenticate);           // all routes require a valid token
router.use(requireClient);          // only clients can access their cart

router.get('/', cartController.getCart);
router.put('/', cartController.syncCart);
router.delete('/', cartController.clearCart);

module.exports = router;