// server/src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

/* GET /api/notifications?recipientId=&unreadOnly=true
 * Polled by the client every ~30s (per the doc) so status changes on
 * Orders/Inquiries surface without needing WebSockets.
 */
router.get('/', async (req, res) => {
  try {
    const { recipientId, unreadOnly } = req.query;
    const match = {};
    if (recipientId) match.recipientId = recipientId;
    if (unreadOnly === 'true') match.isRead = false;

    const notifications = await Notification.find(match).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* PUT /api/notifications/:id/read */
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

// Mount in your app entry:
//   app.use('/api/notifications', require('./src/routes/notificationRoutes'));