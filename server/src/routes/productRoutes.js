const express = require('express');
const router = express.Router(); 

const productController = require('../controllers/productController'); 

// ✨ NAYA ROUTE: Get Cloudinary upload signature (MUST BE BEFORE /:id)
router.get('/upload-signature', productController.getUploadSignature);

// Define the POST road (Create)
router.post('/', productController.createProduct); 

// Define the GET road (Read)
router.get('/', productController.getAllProducts); 

router.put('/:id', productController.updateProduct); 

module.exports = router;