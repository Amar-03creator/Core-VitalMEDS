const express = require('express');
const router = express.Router();
const {
    createCompany,
    getAllCompanies,
    getCompanyById,
    updateCompany,
    toggleCompanyStatus,
} = require('../controllers/companyController');

// GET /api/companies            -> list all suppliers (+ outstanding stats)
// POST /api/companies           -> create a new supplier
router.get('/', getAllCompanies);
router.post('/', createCompany);

// GET /api/companies/:id        -> single supplier (360° view)
// PUT /api/companies/:id        -> update supplier profile
router.get('/:id', getCompanyById);
router.put('/:id', updateCompany);

// PATCH /api/companies/:id/status  -> toggle Active/Inactive
router.patch('/:id/status', toggleCompanyStatus);

module.exports = router;