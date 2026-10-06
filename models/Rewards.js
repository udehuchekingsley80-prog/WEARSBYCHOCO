const mongoose = require('mongoose');

const rewardsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
  pointsBalance: { type: Number, required: true, validate: { validator: Number.isInteger, message: 'pointsBalance must be an integer' } },
  tier: { type: String, enum: ['Silver', 'Gold', 'Platinum', 'Signature'], default: 'Silver' },
  pointsToNextTier: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: false });

module.exports = mongoose.model('Rewards', rewardsSchema);
