const mongoose = require('mongoose');
const { integerCentsValidator } = require('./validators');

const accountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['checking', 'savings'], required: true },
  nickname: { type: String, required: true },
  accountNumber: { type: String, required: true, unique: true },
  routingNumber: { type: String, required: true },
  balanceCents: { type: Number, required: true, validate: integerCentsValidator },
  availableBalanceCents: { type: Number, required: true, validate: integerCentsValidator },
  interestRateBps: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'frozen', 'closed'], default: 'active' },
  openedAt: { type: Date, default: Date.now },
}, { timestamps: false });

module.exports = mongoose.model('Account', accountSchema);
