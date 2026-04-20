const express = require('express');

// 1. Create an Express Router instance
const router = express.Router(); 

// 2. Import the controller we just built
const salesInvoiceController = require('../controllers/salesInvoiceController'); 

// 3. Define the route.
// When a POST request hits the root ('/'), run the createSalesInvoice function
router.post('/', salesInvoiceController.createSalesInvoice); 
router.get('/', salesInvoiceController.getAllSalesInvoices); // 4. Export this router so that it can be used in server.js
module.exports = router;