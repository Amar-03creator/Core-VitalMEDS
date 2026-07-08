// server/src/routes/inquiryRoutes.js
const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiryController');

router.post('/', inquiryController.createInquiry);
router.get('/', inquiryController.getInquiries);
router.get('/:id', inquiryController.getInquiryById);
router.put('/:id', inquiryController.updateInquiry);
router.put('/:id/cancel', inquiryController.cancelInquiry);
router.put('/:id/seen', inquiryController.markSeen);
router.put('/:id/quote', inquiryController.sendQuote);
router.put('/:id/reject', inquiryController.rejectInquiry);
router.put('/:id/request-changes', inquiryController.requestChanges);

module.exports = router;

// Mount in your app entry:
//   app.use('/api/inquiries', require('./src/routes/inquiryRoutes'));