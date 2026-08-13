// const express = require('express');
// const router = express.Router();
// const {
//     generateSuggestions,
//     exportPurchaseOrders,
// } = require('../controllers/replenishmentController');

// // POST /api/replenishment/suggestions   -> compute suggested reorder quantities
// router.post('/suggestions', generateSuggestions);


// module.exports = router;

const express = require('express');
const router = express.Router();

// Adjust this import path to match where your authMiddleware actually lives
// (the report references `authenticate` and `requireAdmin` from authMiddleware.js)
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const replenishmentController = require('../controllers/replenishmentController');

router.post('/suggestions', authenticate, requireAdmin, replenishmentController.generateSuggestions);

module.exports = router;

/*
  Mount this in your main app/router file, e.g.:

  app.use('/api/admin/purchases/reorder', require('./routes/replenishmentRoutes'));

  That gives you: POST /api/admin/purchases/reorder/suggestions
*/