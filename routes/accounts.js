const express = require('express');
const { Account, Transaction } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const accounts = await Account.find({ userId: req.session.userId }).sort({ type: 1 });
  res.json({ accounts });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const account = await Account.findOne({ _id: req.params.id, userId: req.session.userId });
  if (!account) return res.status(404).json({ error: 'Account not found.' });
  res.json({ account });
}));

router.get('/:id/transactions', asyncHandler(async (req, res) => {
  const account = await Account.findOne({ _id: req.params.id, userId: req.session.userId });
  if (!account) return res.status(404).json({ error: 'Account not found.' });

  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const transactions = await Transaction.find({ accountId: account._id })
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json({ transactions });
}));

module.exports = router;
