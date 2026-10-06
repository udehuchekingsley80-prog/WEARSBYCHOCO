const crypto = require('crypto');

// Synchronizer-token CSRF pattern: a random token is stored in the session
// on login and must be echoed back as the X-CSRF-Token header on every
// mutating request (POST/PUT/PATCH/DELETE).

function issueCsrfToken(req) {
  const secret = process.env.CSRF_SECRET || 'northstar-csrf-fallback';
  const token = crypto.createHmac('sha256', secret)
    .update(req.session.id + crypto.randomBytes(16).toString('hex'))
    .digest('hex');
  req.session.csrfToken = token;
  return token;
}

function requireCsrfToken(req, res, next) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();

  const headerToken = req.get('X-CSRF-Token');
  const sessionToken = req.session && req.session.csrfToken;

  if (!sessionToken || !headerToken || headerToken !== sessionToken) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token.' });
  }
  next();
}

module.exports = { issueCsrfToken, requireCsrfToken };
