const express = require('express');
const { body } = require('express-validator');
const { Notification, EmailNotification } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/asyncHandler');
const { sendEmail } = require('../utils/mailer');

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

router.post('/send-message', [
  body('toEmail').isEmail().withMessage('Please enter a valid recipient email.'),
  body('subject').trim().notEmpty().withMessage('Subject is required.'),
  body('body').trim().notEmpty().withMessage('Message is required.'),
], handleValidation, asyncHandler(async (req, res) => {
  const { toEmail, subject, body, relatedTransferId } = req.body;
  const result = await sendEmail({
    userId: req.session.userId,
    toEmail: toEmail.trim(),
    subject: subject.trim(),
    body: body.trim(),
    html: `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#12161f;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
        <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#1c4fd6);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">N</div>
        <div style="font-family:IBM Plex Sans,sans-serif;font-weight:700;font-size:18px;">Northstar Financial</div>
      </div>
      <div style="white-space:pre-wrap;line-height:1.6;">${escapeHtml(body.trim()).replace(/\n/g, '<br>')}</div>
    </div>`,
    type: 'custom_message',
    relatedTransferId: relatedTransferId || null,
  });
  res.json({ success: true, status: result.status, emlPath: result.emlPath });
}));

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = router;
