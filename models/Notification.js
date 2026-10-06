const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  category: { type: String, enum: ['statement', 'security', 'transfer', 'rewards', 'general'], default: 'general' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

module.exports = mongoose.model('Notification', notificationSchema);
