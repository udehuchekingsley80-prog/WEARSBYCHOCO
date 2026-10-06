const mongoose = require('mongoose');

const emailNotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  toEmail: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, required: true },
  relatedTransferId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transfer', default: null },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  emlPath: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

module.exports = mongoose.model('EmailNotification', emailNotificationSchema);
