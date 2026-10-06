const mongoose = require('mongoose');
const { integerCentsValidator } = require('./validators');

const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
  type: { type: String, enum: ['debit', 'credit'], required: true },
  cardNumber: { type: String, required: true, unique: true },
  cardHolder: { type: String, required: true },
  expiryMonth: { type: Number, required: true, min: 1, max: 12 },
  expiryYear: { type: Number, required: true },
  cvvHash: { type: String, required: true },
  network: { type: String, default: 'Northstar Network' },
  status: { type: String, enum: ['active', 'frozen', 'cancelled'], default: 'active' },
  creditLimitCents: { type: Number, default: null, validate: { validator: (v) => v === null || Number.isInteger(v), message: 'creditLimitCents must be an integer' } },
  creditBalanceCents: { type: Number, default: null, validate: { validator: (v) => v === null || Number.isInteger(v), message: 'creditBalanceCents must be an integer' } },
  statementBalanceCents: { type: Number, default: null, validate: { validator: (v) => v === null || Number.isInteger(v), message: 'statementBalanceCents must be an integer' } },
  minimumPaymentCents: { type: Number, default: null, validate: { validator: (v) => v === null || Number.isInteger(v), message: 'minimumPaymentCents must be an integer' } },
  paymentDueDate: { type: Date, default: null },
  aprBps: { type: Number, default: null },
}, { timestamps: false });

module.exports = mongoose.model('Card', cardSchema);
