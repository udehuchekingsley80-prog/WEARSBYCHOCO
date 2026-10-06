const mongoose = require('mongoose');
const { integerCentsValidator } = require('./validators');

const transferSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fromAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  recipientName: { type: String, required: true },
  recipientAccountNumber: { type: String, required: true },
  recipientRoutingNumber: { type: String, required: true },
  recipientEmail: { type: String, default: '' },
  transferType: {
    type: String,
    enum: ['Internal Transfer', 'External ACH', 'Wire Transfer', 'Northstar Pay'],
    required: true,
  },
  memo: { type: String, default: '' },
  amountCents: { type: Number, required: true, validate: integerCentsValidator },
  notifyRecipient: { type: Boolean, default: false },
  status: { type: String, enum: ['completed', 'failed'], default: 'completed' },
  confirmationCode: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

module.exports = mongoose.model('Transfer', transferSchema);
