const express = require('express');
const {
  Account, Card, Transaction, Transfer,
} = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const userAccounts = await Account.find({ userId: req.session.userId }).select('_id');
    const userCards = await Card.find({ userId: req.session.userId }).select('_id');
    const accountIds = userAccounts.map((a) => a._id);
    const cardIds = userCards.map((c) => c._id);

    const filter = {
      $or: [{ accountId: { $in: accountIds } }, { cardId: { $in: cardIds } }],
    };

    if (req.query.accountId) {
      if (!accountIds.some((id) => id.toString() === req.query.accountId)) {
        return res.status(403).json({ error: 'Not authorized to view this account.' });
      }
      delete filter.$or;
      filter.accountId = req.query.accountId;
    }

    if (req.query.cardId) {
      if (!cardIds.some((id) => id.toString() === req.query.cardId)) {
        return res.status(403).json({ error: 'Not authorized to view this card.' });
      }
      delete filter.$or;
      filter.cardId = req.query.cardId;
    }

    if (req.query.direction && ['debit', 'credit'].includes(req.query.direction)) {
      filter.direction = req.query.direction;
    }

    if (req.query.search) {
      const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$and = [
        { $or: [{ description: regex }, { merchant: regex }] },
      ];
    }

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.createdAt.$lte = new Date(`${req.query.endDate}T23:59:59.999Z`);
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Number(req.query.pageSize) || 20, 100);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
      Transaction.countDocuments(filter),
    ]);

    res.json({ transactions, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 });
  } catch (err) {
    res.status(500).json({ error: 'Could not load transactions.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found.' });

    let account = null;
    let card = null;

    if (transaction.accountId) {
      account = await Account.findOne({ _id: transaction.accountId, userId: req.session.userId });
    }
    if (transaction.cardId) {
      card = await Card.findOne({ _id: transaction.cardId, userId: req.session.userId }).select('-cvvHash -__v');
    }

    // The transaction must belong to one of this user's own accounts/cards —
    // never trust the :id alone to prove ownership.
    if (!account && !card) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    let transfer = null;
    if (transaction.transferId) {
      transfer = await Transfer.findOne({ _id: transaction.transferId, userId: req.session.userId });
    }

    res.json({ transaction, account, card, transfer });
  } catch (err) {
    res.status(500).json({ error: 'Could not load this transaction.' });
  }
});

module.exports = router;
