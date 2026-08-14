const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getAdminProfile,
  updateAdminProfile,
  requestVaultChange,    
  verifyVaultChange,     
  listDocumentRequests,
  approveRejectDocumentRequest,
  verifyClientDocument,
  deleteDocumentHistory,
  generateInviteCode,
  precheckAdminContact, 
  updateAdminContact,
  inviteCompetentPerson,
  updateLegalInfo,
} = require('../controllers/adminController');

// Import the workflow controller functions
const {
  approveClient,
  rejectClient,
  requestDocumentUpdate
} = require('../controllers/clientController/workflowController');

// ── Admin's own profile & Vault ─────────────────────────────────────
router.get('/me', authenticate, authorize('admin'), getAdminProfile);
router.put('/me/profile', authenticate, authorize('admin'), updateAdminProfile); // Grace period direct updates
router.post('/me/vault/request', authenticate, authorize('admin'), requestVaultChange); // Trigger OTPs for locked vault
router.post('/me/vault/verify', authenticate, authorize('admin'), verifyVaultChange); // Verify OTPs and apply changes

router.post('/me/cp/invite', authenticate, authorize('admin'), inviteCompetentPerson);

router.post('/me/contact/precheck', authenticate, authorize('admin'), precheckAdminContact);
router.put('/me/contact', authenticate, authorize('admin'), updateAdminContact);

// ── Client document request review ──────────────────────────────────
router.get('/documents/requests', authenticate, authorize('admin'), listDocumentRequests);
router.put('/documents/requests/:requestId', authenticate, authorize('admin'), approveRejectDocumentRequest);
router.put('/me/legal', authenticate, authorize('admin'), updateLegalInfo);

// ── Client document verification ────────────────────────────────────
router.put('/clients/:clientId/documents/verify', authenticate, authorize('admin'), verifyClientDocument);
router.delete('/clients/:clientId/documents/history/:historyId', authenticate, authorize('admin'), deleteDocumentHistory);

// ── Generate Invite Code ─────────────────────────────────────────────
router.post('/clients/:clientId/invite-code', authenticate, authorize('admin'), generateInviteCode);

// ── Client Approval & Action Workflows ──────────────────────────────
router.put('/clients/:id/approve', authenticate, authorize('admin'), approveClient);
router.put('/clients/:id/reject', authenticate, authorize('admin'), rejectClient);
router.post('/clients/:id/documents/request', authenticate, authorize('admin'), requestDocumentUpdate);

module.exports = router;