const rateLimit = require('express-rate-limit');

// 6 attempts per 10 minutes, keyed by IP + attempted username so one
// account can't be hammered from a single IP while another user on the
// same IP is unaffected, and vice versa.
const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 6,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const username = (req.body && req.body.username ? String(req.body.username) : '').toLowerCase();
    return `${req.ip}:${username}`;
  },
  message: { error: 'Too many login attempts. Please try again later.' },
});

const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginRateLimiter, generalApiLimiter };
