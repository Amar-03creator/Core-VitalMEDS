const express = require('express'); 
const router = express.Router();
const clientController = require('../controllers/clientController');
// Register a new client
router.post('/register', clientController.registerClient);
// Get all clients
router.get('/', clientController.getAllClients);
// Get a client by ID
router.get('/:id', clientController.getClientById); 

module.exports = router;