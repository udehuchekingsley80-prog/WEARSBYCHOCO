const mongoose = require('mongoose');

const rewardsActivitySchema = new mongoose.Schema({
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rewards', required: true, index: true },
  points: { type: Number, required: true, validate: { validator: Number.isInteger, message: 'points must be an integer' } },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

module.exports = mongoose.model('RewardsActivity', rewardsActivitySchema);
