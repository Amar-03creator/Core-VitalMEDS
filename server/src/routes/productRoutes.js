const express = require('express');
const router = express.Router(); // Hint: Capital 'R'

// Import the brain you just built
const productController = require('../controllers/productController'); 

// Define the POST road (Create)
router.post('/', productController.createProduct); // Hint: Method is POST, function is createProduct

// Define the GET road (Read)
router.get('/', productController.getAllProducts); // Hint: Method is GET, function is getAllProducts

module.exports = router;