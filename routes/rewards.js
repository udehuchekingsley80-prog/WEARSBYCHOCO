const express = require('express');
const { Rewards, RewardsActivity } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const rewards = await Rewards.findOne({ userId: req.session.userId });
  if (!rewards) return res.json({ rewards: null, activity: [] });

  const activity = await RewardsActivity.find({ rewardId: rewards._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ rewards, activity });
}));

module.exports = router;
