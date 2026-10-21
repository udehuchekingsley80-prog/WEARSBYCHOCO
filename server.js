require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');

const { requireCsrfToken } = require('./middleware/csrf');
const { generalApiLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/auth');
const accountsRoutes = require('./routes/accounts');
const cardsRoutes = require('./routes/cards');
const transfersRoutes = require('./routes/transfers');
const transactionsRoutes = require('./routes/transactions');
const statementsRoutes = require('./routes/statements');
const notificationsRoutes = require('./routes/notifications');
const rewardsRoutes = require('./routes/rewards');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/northstar_financial';
const isProduction = process.env.NODE_ENV === 'production';

function delay(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

// MongoDB connectivity issues (a wrong Atlas IP allowlist entry, a brief
// network blip, Atlas doing maintenance) should never take the whole site
// down. This retries forever with a capped backoff — the API-readiness
// middleware below returns a clean 503 in the meantime — so the app quietly
// heals itself the moment the database becomes reachable again, with no
// need to notice and manually restart the process.
async function connectForever(uri) {
  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
      console.log(`Connected to MongoDB${attempt > 1 ? ` (after ${attempt} attempts)` : ''}.`);
      return mongoose.connection.getClient();
    } catch (err) {
      const waitMs = Math.min(2000 * attempt, 30000);
      console.error(`MongoDB connection attempt ${attempt} failed: ${err.message} — retrying in ${Math.round(waitMs / 1000)}s.`);
      await delay(waitMs);
    }
  }
}

mongoose.connection.on('disconnected', () => {
  console.error('Lost the MongoDB connection — API requests will return 503 until it reconnects.');
});
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB connection restored.');
});

// Kick the connection off immediately. The resulting promise is handed to
// the session store below so it shares mongoose's own connection/retry
// lifecycle instead of independently managing (and possibly desyncing from)
// a second connection to the same cluster.
const mongoClientPromise = connectForever(MONGODB_URI);

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static pages/assets are served before anything that touches MongoDB, so
// login.html and every other page always load — even during a database
// outage — instead of the whole site depending on a DB connection just to
// render HTML that doesn't need one.
app.use(express.static(path.join(__dirname, 'public')));

// If the database isn't connected yet (startup still retrying, or a
// transient outage), fail API requests fast with a clear, friendly message
// instead of letting them hang on a session-store call that can't complete.
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'The service is temporarily unavailable. Please try again in a moment.' });
  }
  next();
});

app.use(session({
  name: 'northstar.sid',
  secret: process.env.SESSION_SECRET || 'northstar-fallback-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ clientPromise: mongoClientPromise, collectionName: 'sessions' }),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 8,
  },
}));

app.use('/api', generalApiLimiter);
app.use('/api', requireCsrfToken);

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/statements', statementsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found.' });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

// Defense-in-depth: a transient MongoDB/network error that somehow still
// reaches here (outside any request's asyncHandler) should be logged, not
// take the whole banking app down. Every route already wraps its async
// handler, so this is a last-resort net, not the primary error path.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection (server kept running):', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (server kept running):', err);
});

// Render (and most hosts) need the server on 0.0.0.0 so it's reachable
// from outside the container. Locally it still works at http://localhost:PORT.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Northstar Financial listening on port ${PORT}`);
});
