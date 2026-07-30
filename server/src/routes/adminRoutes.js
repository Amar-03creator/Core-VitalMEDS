// server/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getAdminProfile,
  updateAdminProfile,
  updateLegalInfo,
  listDocumentRequests,
  approveRejectDocumentRequest,
  verifyClientDocument,
  deleteDocumentHistory,
  generateInviteCode,
  precheckAdminContact, 
  updateAdminContact
} = require('../controllers/adminController');

// ✨ ADDED: Import the workflow controller functions
const {
  approveClient,
  rejectClient,
  requestDocumentUpdate
} = require('../controllers/clientController/workflowController');

// ── Admin's own profile ─────────────────────────────────────────────
router.get('/me', authenticate, authorize('admin'), getAdminProfile);
router.put('/me', authenticate, authorize('admin'), updateAdminProfile);
router.put('/me/legal', authenticate, authorize('admin'), updateLegalInfo);
router.post('/me/contact/precheck', authenticate, authorize('admin'), precheckAdminContact);
router.put('/me/contact', authenticate, authorize('admin'), updateAdminContact);

// ── Client document request review ──────────────────────────────────
router.get('/documents/requests', authenticate, authorize('admin'), listDocumentRequests);
router.put('/documents/requests/:requestId', authenticate, authorize('admin'), approveRejectDocumentRequest);

// ── Client document verification ────────────────────────────────────
router.put('/clients/:clientId/documents/verify', authenticate, authorize('admin'), verifyClientDocument);
router.delete('/clients/:clientId/documents/history/:historyId', authenticate, authorize('admin'), deleteDocumentHistory);

// ── Generate Invite Code ─────────────────────────────────────────────
router.post('/clients/:clientId/invite-code', authenticate, authorize('admin'), generateInviteCode);

// ── ✨ NEW: Client Approval & Action Workflows ──────────────────────
router.put('/clients/:id/approve', authenticate, authorize('admin'), approveClient);
router.put('/clients/:id/reject', authenticate, authorize('admin'), rejectClient);
router.post('/clients/:id/documents/request', authenticate, authorize('admin'), requestDocumentUpdate);

module.exports = router;