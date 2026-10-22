const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { Account, Transaction, Transfer, User } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/asyncHandler');
const { parseDollarsToCents, formatCents } = require('../utils/money');
const { generateConfirmationCode } = require('../utils/identifiers');
const { sendEmail } = require('../utils/mailer');
const { buildDebitNotificationEmail, buildTransferNotificationEmail } = require('../utils/emailTemplates');

const router = express.Router();
router.use(requireAuth);

const TRANSFER_TYPES = ['Internal Transfer', 'External ACH', 'Wire Transfer', 'Northstar Pay'];
const PIN_LOCK_DURATION_MS = 5 * 60 * 1000;
const MAX_PIN_ATTEMPTS = 5;

const transferValidators = [
  body('fromAccountId').notEmpty().withMessage('Please choose a source account.'),
  body('amount').notEmpty().withMessage('Please enter an amount.'),
  body('recipientName').trim().notEmpty().withMessage('Recipient name is required.'),
  body('recipientAccountNumber').trim().notEmpty().withMessage('Recipient account number is required.'),
  body('recipientRoutingNumber').trim().matches(/^\d{9}$/).withMessage('Routing number must be exactly 9 digits.'),
  body('transferType').isIn(TRANSFER_TYPES).withMessage('Please choose a valid transfer type.'),
  body('recipientEmail').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid recipient email.'),
];

const pinValidators = [
  body('pin').trim().matches(/^\d{4}$/).withMessage('Please enter your 4-digit PIN.'),
];

/**
 * Verifies the transfer PIN before any money moves. Locks PIN entry for 5
 * minutes after 5 consecutive wrong attempts, independent of the login
 * lockout. Returns null on success, or an { statusCode, message } object.
 */
async function verifyPin(userId, pin) {
  const user = await User.findById(userId);
  if (!user) return { statusCode: 401, message: 'Not authenticated.' };

  if (user.pinLockedUntil && user.pinLockedUntil.getTime() > Date.now()) {
    const secondsLeft = Math.ceil((user.pinLockedUntil.getTime() - Date.now()) / 1000);
    return { statusCode: 423, message: `Too many incorrect PIN attempts. Try again in ${secondsLeft} seconds.` };
  }

  const pinMatches = await bcrypt.compare(pin, user.pinHash);
  if (!pinMatches) {
    user.pinFailedAttempts += 1;
    if (user.pinFailedAttempts >= MAX_PIN_ATTEMPTS) {
      user.pinLockedUntil = new Date(Date.now() + PIN_LOCK_DURATION_MS);
      user.pinFailedAttempts = 0;
    }
    await user.save();
    // 403, not 401 — the session itself is still valid, only the PIN was
    // wrong. The frontend's fetch wrapper treats any 401 as "not
    // authenticated" and force-redirects to login, which would be wrong here.
    return { statusCode: 403, message: 'Incorrect PIN. Please try again.' };
  }

  if (user.pinFailedAttempts !== 0 || user.pinLockedUntil) {
    user.pinFailedAttempts = 0;
    user.pinLockedUntil = null;
    await user.save();
  }

  return null;
}

async function loadAndValidateTransfer(req) {
  const account = await Account.findOne({ _id: req.body.fromAccountId, userId: req.session.userId });
  if (!account) {
    return { error: { statusCode: 404, message: 'Source account not found.' } };
  }
  if (account.status !== 'active') {
    return { error: { statusCode: 400, message: 'This account is not active and cannot send transfers.' } };
  }

  let amountCents;
  try {
    amountCents = parseDollarsToCents(req.body.amount);
  } catch (err) {
    return { error: { statusCode: 400, message: 'Please enter a valid dollar amount.' } };
  }

  if (amountCents <= 0) {
    return { error: { statusCode: 400, message: 'Transfer amount must be greater than zero.' } };
  }

  if (amountCents > account.availableBalanceCents) {
    return {
      error: {
        statusCode: 400,
        message: `This transfer of ${formatCents(amountCents)} exceeds your available balance of ${formatCents(account.availableBalanceCents)}.`,
      },
    };
  }

  return { account, amountCents };
}

router.post('/review', transferValidators, handleValidation, asyncHandler(async (req, res) => {
  const { account, amountCents, error } = await loadAndValidateTransfer(req);
  if (error) return res.status(error.statusCode).json({ error: error.message });

  res.json({
    review: {
      fromAccountId: account._id,
      fromAccountNickname: account.nickname,
      currentBalanceCents: account.balanceCents,
      balanceAfterCents: account.balanceCents - amountCents,
      amountCents,
      recipientName: req.body.recipientName,
      recipientAccountNumber: req.body.recipientAccountNumber,
      recipientRoutingNumber: req.body.recipientRoutingNumber,
      recipientEmail: req.body.recipientEmail || '',
      transferType: req.body.transferType,
      memo: req.body.memo || '',
      notifyRecipient: !!req.body.notifyRecipient,
    },
  });
}));

router.post('/confirm', transferValidators, pinValidators, handleValidation, asyncHandler(async (req, res) => {
  const pinError = await verifyPin(req.session.userId, req.body.pin);
  if (pinError) return res.status(pinError.statusCode).json({ error: pinError.message });

  const session = await mongoose.startSession();
  try {
    let payload;
    await session.withTransaction(async () => {
      const account = await Account.findOne(
        { _id: req.body.fromAccountId, userId: req.session.userId },
      ).session(session);

      if (!account) {
        throw Object.assign(new Error('Source account not found.'), { statusCode: 404 });
      }
      if (account.status !== 'active') {
        throw Object.assign(new Error('This account is not active and cannot send transfers.'), { statusCode: 400 });
      }

      let amountCents;
      try {
        amountCents = parseDollarsToCents(req.body.amount);
      } catch (err) {
        throw Object.assign(new Error('Please enter a valid dollar amount.'), { statusCode: 400 });
      }

      if (amountCents <= 0) {
        throw Object.assign(new Error('Transfer amount must be greater than zero.'), { statusCode: 400 });
      }

      // Re-validate against the live balance at the moment of commit.
      if (amountCents > account.availableBalanceCents) {
        throw Object.assign(
          new Error(`This transfer of ${formatCents(amountCents)} exceeds your available balance of ${formatCents(account.availableBalanceCents)}.`),
          { statusCode: 400 },
        );
      }

      const confirmationCode = generateConfirmationCode();

      account.balanceCents -= amountCents;
      account.availableBalanceCents -= amountCents;
      await account.save({ session });

      const [transfer] = await Transfer.create([{
        userId: req.session.userId,
        fromAccountId: account._id,
        recipientName: req.body.recipientName,
        recipientAccountNumber: req.body.recipientAccountNumber,
        recipientRoutingNumber: req.body.recipientRoutingNumber,
        recipientEmail: req.body.recipientEmail || '',
        transferType: req.body.transferType,
        memo: req.body.memo || '',
        amountCents,
        notifyRecipient: !!req.body.notifyRecipient,
        status: 'completed',
        confirmationCode,
        createdAt: new Date(),
      }], { session });

      await Transaction.create([{
        accountId: account._id,
        cardId: null,
        type: 'transfer',
        direction: 'debit',
        amountCents,
        description: `${req.body.transferType} to ${req.body.recipientName}`,
        merchant: req.body.recipientName,
        category: 'Transfer',
        balanceAfterCents: account.balanceCents,
        status: 'posted',
        transferId: transfer._id,
        createdAt: new Date(),
      }], { session });

      payload = { account, transfer };
    });

    const user = await User.findById(req.session.userId);
    const { account, transfer } = payload;

    const whenText = transfer.createdAt.toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
    const amountText = formatCents(transfer.amountCents);
    const senderFullName = `${user.firstName} ${user.lastName}`.trim();

    // Respond immediately so the client shows the receipt without waiting for
    // the (non-critical) notification emails to be generated and stored.
    res.json({
      success: true,
      confirmationCode: transfer.confirmationCode,
      newBalanceCents: account.balanceCents,
      transferId: transfer._id,
    });

    // Notification emails are best-effort: generate + store them in the
    // background so a slow mailer can never block or fail the transfer.
    (async () => {
      try {
        const ownerEmailBody = [
          `Hello ${senderFullName},`,
          '',
          `A transfer of ${amountText} was sent from your ${account.nickname} (account ending ${account.accountNumber.slice(-4)}) to ${transfer.recipientName}.`,
          `Transfer type: ${transfer.transferType}`,
          transfer.memo ? `Memo: ${transfer.memo}` : null,
          `Confirmation code: ${transfer.confirmationCode}`,
          `New balance: ${formatCents(account.balanceCents)}`,
          '',
          'If you did not authorize this transfer, please contact Northstar Financial support immediately.',
        ].filter(Boolean).join('\n');

        const ownerEmailHtml = buildDebitNotificationEmail({
          recipientTitle: '',
          recipientName: senderFullName,
          amountText,
          accountNickname: account.nickname,
          accountLast4: account.accountNumber.slice(-4),
          toName: transfer.recipientName,
          transferType: transfer.transferType,
          memo: transfer.memo,
          confirmationCode: transfer.confirmationCode,
          newBalanceText: formatCents(account.balanceCents),
          whenText,
        });

        await sendEmail({
          userId: user._id,
          toEmail: user.email,
          subject: 'Northstar Financial — Debit Notification',
          body: ownerEmailBody,
          html: ownerEmailHtml,
          type: 'debit_notification',
          relatedTransferId: transfer._id,
        });

        if (transfer.notifyRecipient && transfer.recipientEmail) {
          const recipientEmailBody = [
            `Hello ${transfer.recipientName},`,
            '',
            `${senderFullName} has sent you a transfer of ${amountText} via Northstar Financial.`,
            transfer.memo ? `Memo: ${transfer.memo}` : null,
            `Confirmation code: ${transfer.confirmationCode}`,
            '',
            'This is an automated notification from Northstar Financial.',
          ].filter(Boolean).join('\n');

          const recipientEmailHtml = buildTransferNotificationEmail({
            recipientName: transfer.recipientName,
            amountText,
            senderName: senderFullName,
            memo: transfer.memo,
            confirmationCode: transfer.confirmationCode,
            whenText,
          });

          await sendEmail({
            userId: user._id,
            toEmail: transfer.recipientEmail,
            subject: 'Northstar Financial — Transfer Notification',
            body: recipientEmailBody,
            html: recipientEmailHtml,
            type: 'transfer_notification',
            relatedTransferId: transfer._id,
          });
        }
      } catch (emailErr) {
        // eslint-disable-next-line no-console
        console.error('Background email send failed:', emailErr.message);
      }
    })();
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'Transfer could not be completed. Please try again.' });
  } finally {
    session.endSession();
  }
}));

router.get('/', asyncHandler(async (req, res) => {
  const transfers = await Transfer.find({ userId: req.session.userId }).sort({ createdAt: -1 }).limit(100);
  res.json({ transfers });
}));

module.exports = router;
