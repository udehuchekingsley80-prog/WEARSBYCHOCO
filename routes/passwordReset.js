const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { User, PasswordReset } = require('../models');
const { handleValidation } = require('../middleware/validate');
const { loginRateLimiter } = require('../middleware/rateLimit');
const { sendEmail } = require('../utils/mailer');
const { buildPasswordResetEmail } = require('../utils/emailTemplates');

const router = express.Router();

// Constants for password reset
const RESET_CODE_LENGTH = 6;
const RESET_CODE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const MAX_RESET_ATTEMPTS = 3;
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

// Helper: generate cryptographically secure 6-digit code
function generateResetCode() {
  return crypto.randomInt(100000, 999999).toString().padStart(6, '0');
}

// Helper: hash code for storage
async function hashCode(code) {
  return bcrypt.hash(code, 12);
}

// Helper: verify code against hash
async function verifyCode(code, hash) {
  return bcrypt.compare(code, hash);
}

/**
 * POST /api/auth/forgot-password
 * Request a password reset code for the given email.
 * Always returns success to prevent email enumeration.
 */
router.post(
  '/forgot-password',
  loginRateLimiter,
  [body('email').isEmail().withMessage('Please enter a valid email address.')],
  handleValidation,
  async (req, res) => {
    const email = req.body.email.trim().toLowerCase();

    try {
      const user = await User.findOne({ username: email });

      // Always return success to prevent email enumeration
      // But only actually send email if user exists
      if (user) {
        const code = generateResetCode();
        const codeHash = await hashCode(code);
        const expiresAt = new Date(Date.now() + RESET_CODE_EXPIRY_MS);

        // Invalidate any existing unconsumed reset requests for this user
        await PasswordReset.updateMany(
          { userId: user._id, consumedAt: null },
          { $set: { consumedAt: new Date() } }
        );

        // Create new reset request
        await PasswordReset.create({
          userId: user._id,
          codeHash,
          email: user.email,
          expiresAt,
        });

        // Send reset code email
        const html = buildPasswordResetEmail({
          code,
          userName: `${user.firstName} ${user.lastName}`.trim(),
          expiresMinutes: 15,
        });

        await sendEmail({
          userId: user._id,
          toEmail: user.email,
          subject: 'Northstar Financial — Your Password Reset Code',
          body: `Your password reset code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please contact support immediately.`,
          html,
          type: 'password_reset_code',
        });
      }

      // Generic success response regardless of whether user exists
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset code has been sent.',
      });
    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ error: 'An unexpected server error occurred.' });
    }
  }
);

/**
 * POST /api/auth/verify-reset-code
 * Verify the password reset code entered by the user.
 */
router.post(
  '/verify-reset-code',
  loginRateLimiter,
  [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('code').matches(/^\d{6}$/).withMessage('Please enter the 6-digit code.'),
  ],
  handleValidation,
  async (req, res) => {
    const email = req.body.email.trim().toLowerCase();
    const code = req.body.code.trim();

    try {
      const user = await User.findOne({ username: email });
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired code.' });
      }

      const resetRecord = await PasswordReset.findOne({
        userId: user._id,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!resetRecord) {
        return res.status(400).json({ error: 'Invalid or expired code.' });
      }

      // Check attempts
      if (resetRecord.attempts >= MAX_RESET_ATTEMPTS) {
        await PasswordReset.updateOne({ _id: resetRecord._id }, { $set: { consumedAt: new Date() } });
        return res.status(429).json({ error: 'Too many failed attempts. Please request a new code.' });
      }

      const codeValid = await verifyCode(code, resetRecord.codeHash);
      if (!codeValid) {
        await PasswordReset.updateOne(
          { _id: resetRecord._id },
          { $inc: { attempts: 1 } }
        );
        return res.status(400).json({ error: 'Invalid code. Please try again.' });
      }

      // Code is valid - mark as consumed and return success with a temporary token
      // We'll use a short-lived session token for the password change step
      const tempToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(tempToken, 12);

      await PasswordReset.updateOne(
        { _id: resetRecord._id },
        { $set: { consumedAt: new Date(), tempTokenHash: tokenHash } }
      );

      res.json({
        success: true,
        message: 'Code verified. You may now set a new password.',
        tempToken, // Client must send this in the next request
      });
    } catch (err) {
      console.error('Verify reset code error:', err);
      res.status(500).json({ error: 'An unexpected server error occurred.' });
    }
  }
);

/**
 * POST /api/auth/resend-reset-code
 * Resend a new password reset code.
 */
router.post(
  '/resend-reset-code',
  loginRateLimiter,
  [body('email').isEmail().withMessage('Please enter a valid email address.')],
  handleValidation,
  async (req, res) => {
    const email = req.body.email.trim().toLowerCase();

    try {
      const user = await User.findOne({ username: email });

      // Always return success to prevent email enumeration
      if (user) {
        // Check if there's a recent reset record to enforce cooldown
        const recentRecord = await PasswordReset.findOne({
          userId: user._id,
          createdAt: { $gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
        }).sort({ createdAt: -1 });

        if (recentRecord) {
          return res.status(429).json({ error: 'Please wait before requesting another code.' });
        }

        const code = generateResetCode();
        const codeHash = await hashCode(code);
        const expiresAt = new Date(Date.now() + RESET_CODE_EXPIRY_MS);

        await PasswordReset.updateMany(
          { userId: user._id, consumedAt: null },
          { $set: { consumedAt: new Date() } }
        );

        await PasswordReset.create({
          userId: user._id,
          codeHash,
          email: user.email,
          expiresAt,
        });

        const html = buildPasswordResetEmail({
          code,
          userName: `${user.firstName} ${user.lastName}`.trim(),
          expiresMinutes: 15,
        });

        await sendEmail({
          userId: user._id,
          toEmail: user.email,
          subject: 'Northstar Financial — Your New Password Reset Code',
          body: `Your new password reset code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please contact support immediately.`,
          html,
          type: 'password_reset_code',
        });
      }

      res.json({
        success: true,
        message: 'If an account with that email exists, a new reset code has been sent.',
      });
    } catch (err) {
      console.error('Resend reset code error:', err);
      res.status(500).json({ error: 'An unexpected server error occurred.' });
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Complete the password reset using the verified temp token.
 */
router.post(
  '/reset-password',
  loginRateLimiter,
  [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('tempToken').notEmpty().withMessage('Invalid session. Please start over.'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
      .matches(/[a-z]/).withMessage('Password must contain a lowercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain a number.')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character.'),
    body('confirmPassword').notEmpty().withMessage('Please confirm your password.'),
  ],
  handleValidation,
  async (req, res) => {
    const { email, tempToken, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    try {
      const user = await User.findOne({ username: email.trim().toLowerCase() });
      if (!user) {
        return res.status(400).json({ error: 'Invalid session. Please start over.' });
      }

      const resetRecord = await PasswordReset.findOne({
        userId: user._id,
        consumedAt: { $ne: null },
        expiresAt: { $gt: new Date() },
      }).sort({ consumedAt: -1 });

      if (!resetRecord || !resetRecord.tempTokenHash) {
        return res.status(400).json({ error: 'Invalid session. Please start over.' });
      }

      const tokenValid = await bcrypt.compare(tempToken, resetRecord.tempTokenHash);
      if (!tokenValid) {
        return res.status(400).json({ error: 'Invalid session. Please start over.' });
      }

      // Hash and update password
      const passwordHash = await bcrypt.hash(password, 12);
      user.passwordHash = passwordHash;
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      await user.save();

      // Fully invalidate the reset record
      await PasswordReset.updateOne({ _id: resetRecord._id }, { $set: { tempTokenHash: null } });

      // Send confirmation email
      const html = buildPasswordResetEmail({
        userName: `${user.firstName} ${user.lastName}`.trim(),
        code: null,
        isConfirmation: true,
      });

      await sendEmail({
        userId: user._id,
        toEmail: user.email,
        subject: 'Northstar Financial — Password Successfully Reset',
        body: `Your password has been successfully reset.\n\nIf you did not make this change, please contact support immediately.`,
        html,
        type: 'password_reset_confirmation',
      });

      res.json({
        success: true,
        message: 'Your password has been reset. You can now sign in with your new password.',
      });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'An unexpected server error occurred.' });
    }
  }
);

module.exports = router;