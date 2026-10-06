const express = require('express');
const { Notification, EmailNotification } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.session.userId }).sort({ createdAt: -1 });
  res.json({ notifications });
}));

router.post('/mark-all-read', asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.session.userId, isRead: false }, { $set: { isRead: true } });
  res.json({ success: true });
}));

router.get('/emails', asyncHandler(async (req, res) => {
  const emails = await EmailNotification.find({ userId: req.session.userId }).sort({ createdAt: -1 });
  res.json({ emails });
}));

module.exports = router;
