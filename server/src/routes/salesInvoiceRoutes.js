const express = require('express');

// 1. Create an Express Router instance
const router = express.Router(); 

// 2. Import the controller we just built
const salesInvoiceController = require('../controllers/salesInvoiceController'); 

// 3. Define the route.
// When a POST request hits the root ('/'), run the createSalesInvoice function
router.post('/', salesInvoiceController.createSalesInvoice); 
router.get('/', salesInvoiceController.getAllSalesInvoices); // 4. Export this router so that it can be used in server.js
router.get('/:id', salesInvoiceController.getSalesInvoiceById);  // 5. Add route for fetching a single invoice by ID
router.put('/:id', salesInvoiceController.updateSalesInvoice);  // 6. Add route for updating a sales invoice by ID
router.delete('/:id', salesInvoiceController.deleteSalesInvoice);  // 7. Add route for deleting a sales invoice by ID
module.exports = router;