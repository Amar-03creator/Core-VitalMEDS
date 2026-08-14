// server/src/routes/clientRoutes.js
const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');

const {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  approveClient,
  rejectClient,
  updateClientStatus,
  getClientInvoices,
  getClientPayments,
  getClientOrders,
  checkDuplicate,
  requestSuspendOtp, 
  verifySuspendOtp,
  reactivateClient,
  // ✨ Added embedded document request controllers ✨
  createDocumentRequest,
  getActiveDocumentRequests,
  resolveDocumentRequest,
  getDistributorProfile,
  getPublicContactInfo
} = require('../controllers/clientController');

const {
  getMyProfile,
  updateMyProfile,
  updateMyContact,
  precheckContact,
  requestDocumentUpload,
  getDocumentUploadTicket,
  confirmDocumentUpload,
} = require('../controllers/clientSelfController');

// ── Directory ──────────────────────────────────────────────────────────
router.get('/', authenticate, authorize('admin'), getAllClients);
router.post('/', authenticate, authorize('admin'), createClient);


router.get('/duplicates/check', checkDuplicate);
router.get('/distributor-profile', authenticate, authorize('client'), getDistributorProfile);
router.get('/public-contact', getPublicContactInfo);

// ── Client self-service ("me") ──────────────────────────────────────────
// MUST be above /:id so Express doesn't treat "me" as an ObjectId.
router.get('/me', authenticate, authorize('client'), getMyProfile);
router.put('/me', authenticate, authorize('client'), updateMyProfile);
router.post('/me/documents/request', authenticate, authorize('client'), requestDocumentUpload);
router.get('/me/documents/upload-ticket', authenticate, authorize('client'), getDocumentUploadTicket);
router.post('/me/documents/confirm', authenticate, authorize('client'), confirmDocumentUpload);
router.put('/me/contact', authenticate, authorize('client'), updateMyContact);
router.post('/me/contact/precheck', authenticate, authorize('client'), precheckContact); // ✨ ADD ROUTE

// ── Single client ──────────────────────────────────────────────────────
router.get('/:id', authenticate, authorize('admin', 'client'), getClientById);
router.put('/:id', authenticate, authorize('admin'), updateClient);

// ── Workflow actions ───────────────────────────────────────────────────
router.put('/:id/approve', authenticate, authorize('admin'), approveClient);
router.put('/:id/reject', authenticate, authorize('admin'), rejectClient);
router.put('/:id/status', authenticate, authorize('admin'), updateClientStatus);

// ── Activity sub-resources (lazy-loaded by tabs) ───────────────────────
router.get('/:id/invoices', authenticate, authorize('admin', 'client'), getClientInvoices);
router.get('/:id/payments', authenticate, authorize('admin', 'client'), getClientPayments);
router.get('/:id/orders', authenticate, authorize('admin', 'client'), getClientOrders);

// ── OTP Suspension Routes ──────────────────────────────────────────────
router.post('/:id/suspend/request-otp', authenticate, authorize('admin'), requestSuspendOtp);
router.post('/:id/suspend/verify-otp', authenticate, authorize('admin'), verifySuspendOtp);
router.put('/:id/reactivate', authenticate, authorize('admin'), reactivateClient);

// ── Document Requests (Embedded Array) ─────────────────────────────────
// POST: Admin creates a request
router.post('/:id/document-requests', authenticate, authorize('admin'), createDocumentRequest);
// GET: Admin or Client views active requests
router.get('/:id/document-requests', authenticate, authorize('admin', 'client'), getActiveDocumentRequests);
// PUT: Admin explicitly dismisses a request
router.put('/:id/document-requests/:requestId/resolve', authenticate, authorize('admin'), resolveDocumentRequest);

module.exports = router;