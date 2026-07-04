const express = require('express');
const router = express.Router();
const {
    createDebitNote,
    getDebitNotesBySupplier,
    markDebitNoteApplied,
} = require('../controllers/debitNoteController');

// POST /api/debit-notes                         -> create a return-to-company debit note
router.post('/', createDebitNote);

// GET  /api/debit-notes/supplier/:supplierId     -> list debit notes for one supplier
router.get('/supplier/:supplierId', getDebitNotesBySupplier);

// PATCH /api/debit-notes/:id/apply               -> mark as adjusted by supplier
router.patch('/:id/apply', markDebitNoteApplied);

module.exports = router;