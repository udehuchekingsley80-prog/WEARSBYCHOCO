const mongoose = require('mongoose');
const { integerCentsValidator } = require('./validators');

const statementSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', default: null },
  label: { type: String, required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  openingBalanceCents: { type: Number, required: true, validate: integerCentsValidator },
  closingBalanceCents: { type: Number, required: true, validate: integerCentsValidator },
  totalCreditsCents: { type: Number, required: true, validate: integerCentsValidator },
  totalDebitsCents: { type: Number, required: true, validate: integerCentsValidator },
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: false });

module.exports = mongoose.model('Statement', statementSchema);
