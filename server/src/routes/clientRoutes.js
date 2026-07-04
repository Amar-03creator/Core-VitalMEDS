// server/src/routes/clientRoutes.js
const express = require('express');
const router  = express.Router();
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
  reactivateClient
} = require('../controllers/clientController');


// TODO: add your auth middleware (e.g. requireAdmin) before each route in production

// ── Directory ──────────────────────────────────────────────────────────
// GET    /api/clients?search=&status=&businessType=&tier=&riskTier=&minScore=&maxScore=
router.get('/',    getAllClients);
// POST   /api/clients
router.post('/',   createClient);

// ✨ ADDED: Duplicate Checker (MUST be above /:id routes so 'duplicates' isn't treated as an ID)
// GET    /api/clients/duplicates/check?field=...&value=...
router.get('/duplicates/check', checkDuplicate);

// ── Single client ──────────────────────────────────────────────────────
// GET    /api/clients/:id
router.get('/:id',          getClientById);
// PUT    /api/clients/:id
router.put('/:id',          updateClient);

// ── Workflow actions ───────────────────────────────────────────────────
// PUT    /api/clients/:id/approve
router.put('/:id/approve',  approveClient);
// PUT    /api/clients/:id/reject     body: { reason? }
router.put('/:id/reject',   rejectClient);
// PUT    /api/clients/:id/status     body: { status }
router.put('/:id/status',   updateClientStatus);

// ── Activity sub-resources (lazy-loaded by tabs) ───────────────────────
// GET    /api/clients/:id/invoices
router.get('/:id/invoices', getClientInvoices);
// GET    /api/clients/:id/payments
router.get('/:id/payments', getClientPayments);
// GET    /api/clients/:id/orders
router.get('/:id/orders',   getClientOrders);


// ADDED: OTP Suspension Routes
router.post('/:id/suspend/request-otp', requestSuspendOtp);
router.post('/:id/suspend/verify-otp', verifySuspendOtp);
// PUT    /api/clients/:id/reactivate
router.put('/:id/reactivate', reactivateClient);


module.exports = router;