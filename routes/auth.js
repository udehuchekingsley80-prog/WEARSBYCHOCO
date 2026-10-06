const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { User } = require('../models');
const { handleValidation } = require('../middleware/validate');
const { loginRateLimiter } = require('../middleware/rateLimit');
const { issueCsrfToken } = require('../middleware/csrf');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const LOCK_DURATION_MS = 5 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

// Issues a CSRF token into the (possibly pre-login) session so the login
// form itself can carry a synchronizer token, before any user is signed in.
router.get('/csrf-token', (req, res) => {
  const token = req.session.csrfToken || issueCsrfToken(req);
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Could not prepare a secure session. Please try again.' });
    res.json({ csrfToken: token });
  });
});

router.post(
  '/login',
  loginRateLimiter,
  [
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  handleValidation,
  async (req, res) => {
    const GENERIC_ERROR = 'That username and password combination is not recognized.';
    const username = req.body.username.trim().toLowerCase();
    const { password } = req.body;

    try {
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ error: GENERIC_ERROR });
      }

      if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
        const secondsLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
        return res.status(423).json({
          error: `This account is temporarily locked due to repeated failed sign-in attempts. Try again in ${secondsLeft} seconds.`,
        });
      }

      const passwordMatches = await bcrypt.compare(password, user.passwordHash);

      if (!passwordMatches) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
          user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
          user.failedLoginAttempts = 0;
        }
        await user.save();
        return res.status(401).json({ error: GENERIC_ERROR });
      }

      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      user.lastLoginAt = new Date();
      await user.save();

      req.session.regenerate((err) => {
        if (err) return res.status(500).json({ error: 'Could not start session.' });

        req.session.userId = user._id.toString();
        const csrfToken = issueCsrfToken(req);

        req.session.save((saveErr) => {
          if (saveErr) return res.status(500).json({ error: 'Could not start session.' });
          res.json({
            success: true,
            csrfToken,
            user: {
              firstName: user.firstName,
              lastName: user.lastName,
              title: user.title,
            },
          });
        });
      });
    } catch (err) {
      res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
    }
  },
);

router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie('northstar.sid');
    if (err) return res.status(500).json({ error: 'Could not sign out cleanly, but your session cookie was cleared.' });
    res.json({ success: true });
  });
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('username title firstName lastName email phone lastLoginAt');
    if (!user) return res.status(401).json({ error: 'Not authenticated.' });
    res.json({
      user,
      csrfToken: req.session.csrfToken || issueCsrfToken(req),
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not load session.' });
  }
});

module.exports = router;
