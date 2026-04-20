const express = require('express');

// 1. Create an Express Router instance
const router = express.Router(); 

// 2. Import the controller we just built
const purchaseBillController = require('../controllers/purchaseBillController'); 

// 3. Define the route. 
// When a POST request hits the root ('/'), run the createPurchaseBill function
router.post('/', purchaseBillController.createPurchaseBill); 
router.get('/', purchaseBillController.getAllPurchaseBills); // 4. Export this router so that it can be used in server.js

module.exports = router;