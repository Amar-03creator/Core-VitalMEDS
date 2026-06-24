// src/routes/clientRoutes.js

const express = require('express');
const router = express.Router();

// Import the controller
const clientController = require('../controllers/clientController');

/* ── Specific/static routes FIRST ───────────────────────────────────── */
router.get('/filter-options', clientController.getClientFilterOptions);

/* ── Generic routes AFTER ───────────────────────────────────────────── */
router.get('/', clientController.getAllClients);

// ★ FIXED: Your function is named 'registerClient', not 'createClient'!
router.post('/', clientController.registerClient);

router.get('/:id', clientController.getClientById);

// ★ IMPORTANT: If you haven't written updateClient and deleteClient inside 
// your clientController.js yet, these MUST be commented out for now, 
// otherwise the server will crash with the exact same error!
// router.put('/:id', clientController.updateClient);
// router.delete('/:id', clientController.deleteClient);

module.exports = router;