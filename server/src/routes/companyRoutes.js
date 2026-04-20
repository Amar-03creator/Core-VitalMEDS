const express = require('express');

// 1. Create an Express Router instance
const router = express.Router(); 

// 2. Import the controller we just built
const companyController = require('../controllers/companyController'); 

// 3. Define the route. 
// When a POST request hits the root ('/'), run the createCompany function
router.post('/', companyController.createCompany); 
router.get('/', companyController.getAllCompanies); // 4. Export this router so that it can be used in server.js

module.exports = router;