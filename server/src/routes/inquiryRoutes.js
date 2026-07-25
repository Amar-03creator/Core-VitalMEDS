// server/src/routes/inquiryRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const inquiryController = require('../controllers/inquiryController');

// Ensure all routes require a valid token
router.use(authenticate);

router.post('/', inquiryController.createInquiry);
router.get('/', inquiryController.getInquiries);
router.get('/:id', inquiryController.getInquiryById);

router.delete('/:id', inquiryController.deleteInquiry);

// Admin-only actions protected by the guard
router.put('/:id/viewed', requireAdmin, inquiryController.markViewed);
router.put('/:id/quote', requireAdmin, inquiryController.sendQuote);

// Both roles can reject, the controller handles the distinction
router.put('/:id/reject', inquiryController.rejectInquiry);

module.exports = router;