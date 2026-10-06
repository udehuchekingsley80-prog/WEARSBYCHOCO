# Northstar Financial

A full-stack digital banking application: Node.js + Express + MongoDB (Mongoose) on the
backend, plain static HTML/CSS/vanilla JS on the frontend. Every account, card, user, and
transaction in it is entirely fictional — it is not connected to any real banking or payment
network.

---

## Quick start

```bash
npm install
npm run setup     # seeds the one demo identity — safe to re-run, never overwrites existing data
npm start         # http://localhost:3000
```

Then sign in at `http://localhost:3000/login.html` with the credentials set in your own `.env`
(`DEMO_USERNAME` / `DEMO_PASSWORD`, read once by `seed.js`). They are never hard-coded in
application source, never logged, and never shown in this README — see `.env.example` for the
generic placeholder defaults (`donald2026` / `donald2026`).

### MongoDB

This app requires a MongoDB server reachable at `MONGODB_URI`, running as a **replica set** —
because transfers and card payments use multi-document ACID transactions
(`session.withTransaction()`), which MongoDB only supports on a replica set / mongos, not a
bare standalone `mongod`.

**This deployment runs against a MongoDB Atlas cluster** (`cluster0.wvxylgg.mongodb.net`), which
is a replica set by default, so transactions work with no extra setup. `MONGODB_URI` in `.env`
uses the **standard (non-SRV) connection string** — listing the three shard hosts directly with
`replicaSet=`/`authSource=` query params — instead of `mongodb+srv://`, because this network's
Node.js DNS resolver couldn't complete the SRV lookup that `mongodb+srv://` requires (the OS
resolver could — `nslookup` worked fine — but Node's own resolver timed out on it). If you hit
the same thing elsewhere, resolve the SRV and TXT records manually (`nslookup -type=SRV
_mongodb._tcp.<host>` and `nslookup -type=TXT <host>`) and build the standard URI from those.

A local MongoDB binary is also vendored under `.mongo-install/` (data persisted to `./data/db`)
as a fallback if you'd rather not use Atlas:

```bash
npm run db:start              # starts the bundled mongod if nothing is already listening on 27017
npm run db:init-replica-set   # one-time: initiates the single-node replica set
```

Point `MONGODB_URI` at `mongodb://127.0.0.1:27017/northstar_financial` to use it instead.

---

## Environment variables (`.env`, see `.env.example`)

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port (default `3000`) |
| `NODE_ENV` | `development` or `production` — controls the `secure` cookie flag |
| `MONGODB_URI` | MongoDB connection string |
| `SESSION_SECRET` | Signs the session cookie |
| `CSRF_SECRET` | Seeds the CSRF token HMAC |
| `DEMO_USERNAME` / `DEMO_PASSWORD` | The one seeded identity's credentials (seed.js only) |
| `TRANSACTION_PIN` | The 4-digit PIN required to confirm a transfer (seed.js only, default `0000`) |
| `EMAIL_TRANSPORT` | `stream` (default — writes real `.eml` files to `sent-emails/`, no network) or `smtp` |
| `EMAIL_FROM` | From header used on outgoing mail |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Only used when `EMAIL_TRANSPORT=smtp` |

`.env` is git-ignored. Nothing in this list is ever sent to the browser or hard-coded in source.

---

## npm scripts

| Script | What it does |
|---|---|
| `npm start` | Runs the server |
| `npm run setup` | Seeds the one identity — no-ops if the `DEMO_USERNAME` user already exists |
| `npm run reset-db` | **Drops** all app collections and reseeds from scratch |
| `npm run db:start` | Starts the local mongod (see above) |
| `npm run db:init-replica-set` | One-time replica set initiation |

---

## The seeded identity

- **User:** Mr. James Leonard — logs in with the `DEMO_USERNAME` / `DEMO_PASSWORD` set in your
  `.env`; the account's on-file contact email (used for debit/transfer notification emails) is
  `j.leonard@northstarfinancial.example`
- **Checking — Northstar Premier Checking:** $967,000.00
- **Savings — Northstar High-Yield Savings:** $1,843,200.75 at 4.25% APY
- **Debit card:** linked to checking, active, BIN `0000`
- **Credit card:** $250,000.00 limit, $12,340.55 balance, $9,864.00 statement balance,
  $350.00 minimum payment, due in ~14 days, 21.99% APR, BIN `0000`
- ~12 historical transactions over the last 60 days across both accounts and the credit card
- 3 months of statements for checking and the credit card
- A Platinum-tier rewards record (184,230 points, 65,770 to next tier) with points-activity history
- 4 starter in-app notifications

`npm run setup` only inserts this data if no `DEMO_USERNAME` user exists yet, so re-running it
after you've made transfers never resets your balance. Only `npm run reset-db` wipes and
reseeds — including picking up a changed `DEMO_USERNAME`/`DEMO_PASSWORD` in `.env`.

**Card and routing numbers are intentionally fake at the network level:** every card number
uses BIN `0000` (not issued to any real network) and every routing number uses the prefix `99`
(not an ABA-assigned prefix) — nothing generated by this app can ever function as a real
payment credential.

---

## Data model (MongoDB / Mongoose)

| Collection | Purpose |
|---|---|
| `users` | Credentials (bcrypt hash only), profile, login-attempt/lockout state |
| `accounts` | Checking/savings — balances, routing/account numbers, status |
| `cards` | Debit/credit — masked in transit is not needed since access is user-scoped, but the CVV hash is stripped from every API response |
| `transfers` | One record per completed transfer, with a unique confirmation code |
| `transactions` | The unified ledger — references an `accountId` and/or `cardId`, always carries `balanceAfterCents` |
| `emailnotifications` | Every email the backend has sent (or attempted), with status, so Notifications → Email Log is a real audit trail, not a mock |
| `statements` | Generated period statements per account/card |
| `rewards` / `rewardsactivity` | Points balance/tier plus a ledger of point-earning events |
| `notifications` | In-app notification feed |

All relationships use `ObjectId` references (e.g. `Account.userId → User`). Every query in every
route is scoped server-side to `req.session.userId` — a client can never supply a foreign user's
ID and see their data; IDs from the client are only ever used as the primary key *within* a
`userId`-scoped query.

---

## Money handling

Every dollar amount is stored and computed as an **integer number of cents** — `balanceCents`,
`amountCents`, etc. — enforced by a Mongoose validator (`Number.isInteger`) on every money
field. `utils/money.js` (mirrored client-side in `public/js/money.js`) is the single source of
truth:

- `parseDollarsToCents("967,000.00")` → `96700000`, using only `regex` + `parseInt` (never
  `parseFloat`, which is unsafe for currency).
- `formatCents(96700000)` → `"$967,000.00"`, using only `Math.trunc` / `%` (never float
  division).

**Transfers and credit-card payments are atomic and re-validated at commit time.** Both use
`mongoose.startSession()` + `session.withTransaction()` so the balance update, the transaction
insert, and (for transfers) the transfer-record insert happen as one atomic unit — a balance can
never change without its transaction record being written, or vice versa. The balance check
against the *live* database value happens inside that same transaction, not against the
possibly-stale numbers shown during the Review step, so a double-submit or a race between two
requests can't overdraw an account. An over-limit attempt is rejected with a message quoting
both amounts, e.g.:

> This transfer of $2,000,000.00 exceeds your available balance of $967,000.00.

---

## Security

- **Passwords:** bcrypt, cost factor 12. Plaintext passwords are never logged or stored.
- **Sessions:** `express-session` + `connect-mongo` (collection `sessions`), so a session — and
  the CSRF token stored in it — survives a server restart. Cookie is `httpOnly`, `sameSite:
  'lax'`, and `secure` when `NODE_ENV=production`.
- **CSRF:** synchronizer-token pattern. `GET /api/auth/csrf-token` issues a token into the
  (possibly pre-login) session; every mutating request must echo it back as `X-CSRF-Token`, or
  it's rejected with 403. The token rotates on login (session regeneration defeats fixation).
- **Login hardening:** `express-rate-limit` (6 attempts / 10 minutes per IP+username) *and* a
  server-side lock (5 consecutive failures → 5-minute lock), independent of each other. Failed
  logins always return the same generic message, regardless of whether the username exists.
- **Authorization:** every account/card/transaction/statement query filters by
  `req.session.userId` taken from the trusted session — never from a client-supplied field.
- **Validation:** `express-validator` on every mutating route.
- **Headers:** `helmet`, with a locked-down CSP (`default-src 'self'`, no inline scripts).
- **Secrets:** all in `.env` (git-ignored); `.env.example` documents every key with safe
  placeholder defaults. Card CVV hashes are stripped from every API response that returns a
  card document.

---

## Email

`utils/mailer.js` is backend-only — it is never imported by any file served to the browser.
With `EMAIL_TRANSPORT=stream` (the default), Nodemailer's stream transport generates a real
RFC 822 message and writes it to `sent-emails/*.eml` with **no network call**, and every send
(recipient, subject, body, type, status) is logged to `emailnotifications` so the Notifications
page's Email Log is showing real data. Switching to `EMAIL_TRANSPORT=smtp` (with
`SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`) sends through a real SMTP server with no code
changes elsewhere. No email ever contains a password, PIN, CVV, session token, or full card
number.

---

## Pages

All reachable from the sidebar (desktop, ≥900px) or the bottom tab bar (mobile), all populated
from the live API on load — none are static mockups:

`index.html` (marketing/redirect) → `login.html` → `dashboard.html` · `accounts.html` ·
`cards.html` · `transfer.html` (4-step wizard: Details → Review → Confirm → Success) ·
`transactions.html` (search/filter/paginate) · `statements.html` · `rewards.html` ·
`notifications.html` (in-app feed + email log) · `profile.html`.

---

## Transaction PIN

Confirming a transfer requires a 4-digit PIN, entered in a modal after Review and before any
money moves — separate from the login password. The PIN is bcrypt-hashed (`User.pinHash`,
never returned by any API response) and seeded from `TRANSACTION_PIN` in `.env` (default
`0000`). It has its own independent lockout: 5 wrong attempts locks PIN entry for 5 minutes,
tracked separately from the login lockout. A wrong PIN returns `403` (not `401`) specifically so
the frontend's blanket "401 → redirect to login" handling doesn't kick the user out of the app
over a mistyped PIN — only the PIN modal shows an error, and the user can retry immediately
without re-entering the transfer.

---

## Verified end-to-end

- `npm install && npm run setup && npm start` runs clean.
- Logging in shows "Hello, welcome, Mr. Leonard." with $967,000.00 checking and $1,843,200.75
  savings.
- A full transfer (Details → Review → Confirm → Success) debits MongoDB atomically, the
  transaction appears immediately in Activity, and both the debit-notification and (when
  requested) recipient-notification emails land in `sent-emails/`.
- An over-limit transfer is rejected with the exact-amount error message.
- Credit-card payment, card freeze/unfreeze, profile update, and notification mark-all-read all
  round-trip through the real API.
- Restarting both MongoDB and the Node server does not reset a balance changed by a transfer —
  only `npm run reset-db` does.
- Verified visually in a real browser (desktop and 390px-wide mobile viewport) for every page.
