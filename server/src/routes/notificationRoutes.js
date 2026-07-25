const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

router.get('/', async (req, res) => {
  try {
    // ✨ ADDED recipientRole
    const { recipientId, recipientRole, unreadOnly } = req.query;
    const match = {};
    if (recipientId) match.recipientId = recipientId;
    if (recipientRole) match.recipientRole = recipientRole; 
    if (unreadOnly === 'true') match.isRead = false;

    // Fixed limit to 100 to show more history
    const notifications = await Notification.find(match).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✨ ADDED: Route to mark ALL as read for a specific role
router.put('/mark-all-read', async (req, res) => {
  try {
    const { recipientRole } = req.body;
    await Notification.updateMany({ recipientRole, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;