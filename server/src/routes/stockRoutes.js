// server/src/routes/stockRoutes.js
const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// POST /api/stock/check-availability
router.post('/check-availability', stockController.checkAvailability);

module.exports = router;

// Mount in your app entry (server.js / app.js) alongside your other routes:
//   app.use('/api/stock', require('./src/routes/stockRoutes'));