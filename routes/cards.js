const express = require('express');
const mongoose = require('mongoose');
const { body } = require('express-validator');
const { Card, Account, Transaction } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/asyncHandler');
const { parseDollarsToCents, formatCents } = require('../utils/money');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const cards = await Card.find({ userId: req.session.userId }).select('-cvvHash -__v');
  res.json({ cards });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const card = await Card.findOne({ _id: req.params.id, userId: req.session.userId }).select('-cvvHash -__v');
  if (!card) return res.status(404).json({ error: 'Card not found.' });
  res.json({ card });
}));

router.get('/:id/transactions', asyncHandler(async (req, res) => {
  const card = await Card.findOne({ _id: req.params.id, userId: req.session.userId });
  if (!card) return res.status(404).json({ error: 'Card not found.' });

  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const transactions = await Transaction.find({ cardId: card._id })
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json({ transactions });
}));

router.post('/:id/freeze', asyncHandler(async (req, res) => {
  const card = await Card.findOne({ _id: req.params.id, userId: req.session.userId });
  if (!card) return res.status(404).json({ error: 'Card not found.' });
  if (card.status === 'cancelled') {
    return res.status(400).json({ error: 'This card has been cancelled and cannot be frozen or unfrozen.' });
  }
  card.status = card.status === 'active' ? 'frozen' : 'active';
  await card.save();
  const { cvvHash, __v, ...safeCard } = card.toObject();
  res.json({ card: safeCard });
}));

router.post(
  '/:id/pay',
  [
    body('fromAccountId').notEmpty().withMessage('Please choose a source account.'),
    body('amount').notEmpty().withMessage('Please enter a payment amount.'),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const card = await Card.findOne({ _id: req.params.id, userId: req.session.userId, type: 'credit' });
    if (!card) return res.status(404).json({ error: 'Credit card not found.' });

    let amountCents;
    try {
      amountCents = parseDollarsToCents(req.body.amount);
    } catch (err) {
      return res.status(400).json({ error: 'Please enter a valid payment amount.' });
    }

    if (amountCents <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
    }

    const session = await mongoose.startSession();
    try {
      let resultPayload;
      await session.withTransaction(async () => {
        const account = await Account.findOne(
          { _id: req.body.fromAccountId, userId: req.session.userId },
        ).session(session);

        if (!account) {
          throw Object.assign(new Error('Source account not found.'), { statusCode: 404 });
        }

        if (amountCents > account.availableBalanceCents) {
          throw Object.assign(
            new Error(
              `This payment of ${formatCents(amountCents)} exceeds your available balance of ${formatCents(account.availableBalanceCents)}.`,
            ),
            { statusCode: 400 },
          );
        }

        const freshCard = await Card.findById(card._id).session(session);
        const paymentAmount = Math.min(amountCents, freshCard.creditBalanceCents);

        account.balanceCents -= amountCents;
        account.availableBalanceCents -= amountCents;
        await account.save({ session });

        freshCard.creditBalanceCents -= paymentAmount;
        if (freshCard.creditBalanceCents < 0) freshCard.creditBalanceCents = 0;
        await freshCard.save({ session });

        await Transaction.create([{
          accountId: account._id,
          cardId: null,
          type: 'credit_card_payment',
          direction: 'debit',
          amountCents,
          description: `Payment to credit card ending ${card.cardNumber.slice(-4)}`,
          merchant: 'Northstar Financial',
          category: 'Payment',
          balanceAfterCents: account.balanceCents,
          status: 'posted',
          createdAt: new Date(),
        }], { session });

        await Transaction.create([{
          accountId: null,
          cardId: freshCard._id,
          type: 'credit_card_payment',
          direction: 'credit',
          amountCents,
          description: 'Payment received',
          merchant: 'Northstar Financial',
          category: 'Payment',
          balanceAfterCents: freshCard.creditBalanceCents,
          status: 'posted',
          createdAt: new Date(),
        }], { session });

        resultPayload = { account, card: freshCard };
      });

      res.json({
        success: true,
        newAccountBalanceCents: resultPayload.account.balanceCents,
        newCardBalanceCents: resultPayload.card.creditBalanceCents,
      });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'Payment could not be processed. Please try again.' });
    } finally {
      session.endSession();
    }
  }),
);

module.exports = router;
