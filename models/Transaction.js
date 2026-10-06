const mongoose = require('mongoose');
const { integerCentsValidator } = require('./validators');

const transactionSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null, index: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', default: null, index: true },
  type: { type: String, required: true },
  direction: { type: String, enum: ['debit', 'credit'], required: true },
  amountCents: { type: Number, required: true, validate: integerCentsValidator },
  description: { type: String, required: true },
  merchant: { type: String, default: '' },
  category: { type: String, default: 'General' },
  balanceAfterCents: { type: Number, required: true, validate: integerCentsValidator },
  status: { type: String, enum: ['posted', 'pending'], default: 'posted' },
  transferId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transfer', default: null },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

transactionSchema.index({ description: 'text', merchant: 'text' });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
