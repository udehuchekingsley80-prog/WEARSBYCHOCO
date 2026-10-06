const express = require('express');
const { Account, Card, Statement } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const userAccounts = await Account.find({ userId: req.session.userId }).select('_id');
  const userCards = await Card.find({ userId: req.session.userId }).select('_id');
  const accountIds = userAccounts.map((a) => a._id);
  const cardIds = userCards.map((c) => c._id);

  const statements = await Statement.find({
    $or: [{ accountId: { $in: accountIds } }, { cardId: { $in: cardIds } }],
  }).sort({ periodEnd: -1 });

  res.json({ statements });
}));

module.exports = router;
