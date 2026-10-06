require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  User, Account, Card, Transaction, Statement, Rewards, RewardsActivity, Notification, Transfer, EmailNotification,
} = require('./models');
const { generateAccountNumber, generateRoutingNumber, generateCardNumber } = require('./utils/identifiers');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/northstar_financial';
const DEMO_USERNAME = (process.env.DEMO_USERNAME || 'donald2026').toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'donald2026';
const TRANSACTION_PIN = process.env.TRANSACTION_PIN || '0000';

const shouldReset = process.argv.includes('--reset');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function createIndexes() {
  await Promise.all([
    User.init(),
    Account.init(),
    Card.init(),
    Transfer.init(),
    Transaction.init(),
    EmailNotification.init(),
    Statement.init(),
    Rewards.init(),
    RewardsActivity.init(),
    Notification.init(),
  ]);
}

async function resetDatabase() {
  console.log('Dropping Northstar Financial collections...');
  const collections = [
    User, Account, Card, Transfer, Transaction, EmailNotification, Statement, Rewards, RewardsActivity, Notification,
  ];
  for (const model of collections) {
    await model.deleteMany({});
  }
  console.log('All collections cleared.');
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  await createIndexes();

  if (shouldReset) {
    await resetDatabase();
  }

  const existing = await User.findOne({ username: DEMO_USERNAME });
  if (existing) {
    if (!existing.pinHash) {
      // Migration path for a user seeded before the transaction PIN existed —
      // add the PIN without touching balances or anything else already there.
      existing.pinHash = await bcrypt.hash(TRANSACTION_PIN, 12);
      await existing.save();
      console.log(`Added a transaction PIN to existing user "${DEMO_USERNAME}".`);
    } else {
      console.log(`User "${DEMO_USERNAME}" already exists — skipping reseed so no balances are overwritten.`);
    }
    await mongoose.disconnect();
    return;
  }

  console.log('Seeding Northstar Financial identity and starter data...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const pinHash = await bcrypt.hash(TRANSACTION_PIN, 12);

  const user = await User.create({
    username: DEMO_USERNAME,
    passwordHash,
    pinHash,
    pinFailedAttempts: 0,
    pinLockedUntil: null,
    title: 'Mr.',
    firstName: 'James',
    lastName: 'Leonard',
    email: 'j.leonard@northstarfinancial.example',
    phone: '(415) 555-0148',
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: daysAgo(400),
  });

  const checking = await Account.create({
    userId: user._id,
    type: 'checking',
    nickname: 'Northstar Premier Checking',
    accountNumber: generateAccountNumber(),
    routingNumber: generateRoutingNumber(),
    balanceCents: 96700000,
    availableBalanceCents: 96700000,
    interestRateBps: 0,
    status: 'active',
    openedAt: daysAgo(390),
  });

  const savings = await Account.create({
    userId: user._id,
    type: 'savings',
    nickname: 'Northstar High-Yield Savings',
    accountNumber: generateAccountNumber(),
    routingNumber: generateRoutingNumber(),
    balanceCents: 184320075,
    availableBalanceCents: 184320075,
    interestRateBps: 425,
    status: 'active',
    openedAt: daysAgo(390),
  });

  const debitCard = await Card.create({
    userId: user._id,
    accountId: checking._id,
    type: 'debit',
    cardNumber: generateCardNumber(),
    cardHolder: 'JAMES LEONARD',
    expiryMonth: 8,
    expiryYear: new Date().getFullYear() + 3,
    cvvHash: await bcrypt.hash('123', 12),
    network: 'Northstar Network',
    status: 'active',
  });

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const creditCard = await Card.create({
    userId: user._id,
    accountId: null,
    type: 'credit',
    cardNumber: generateCardNumber(),
    cardHolder: 'JAMES LEONARD',
    expiryMonth: 11,
    expiryYear: new Date().getFullYear() + 4,
    cvvHash: await bcrypt.hash('456', 12),
    network: 'Northstar Network',
    status: 'active',
    creditLimitCents: 25000000,
    creditBalanceCents: 1234055,
    statementBalanceCents: 986400,
    minimumPaymentCents: 35000,
    paymentDueDate: dueDate,
    aprBps: 2199,
  });

  // --- Transactions: checking ---
  const checkingTx = [
    { daysBack: 58, type: 'deposit', direction: 'credit', amount: 1850000, description: 'Payroll Direct Deposit — Meridian Analytics LLC', merchant: 'Meridian Analytics LLC', category: 'Income' },
    { daysBack: 55, type: 'purchase', direction: 'debit', amount: 42500, description: 'Card Purchase — Whole Foods Market', merchant: 'Whole Foods Market', category: 'Groceries' },
    { daysBack: 50, type: 'purchase', direction: 'debit', amount: 18900, description: 'Card Purchase — Shell Fuel Station', merchant: 'Shell Fuel Station', category: 'Transportation' },
    { daysBack: 44, type: 'wire_in', direction: 'credit', amount: 5000000, description: 'Incoming Wire — Blackstone Family Office', merchant: 'Blackstone Family Office', category: 'Wire Transfer' },
    { daysBack: 40, type: 'purchase', direction: 'debit', amount: 65000, description: 'Card Purchase — Nordstrom', merchant: 'Nordstrom', category: 'Shopping' },
    { daysBack: 33, type: 'transfer', direction: 'debit', amount: 250000, description: 'Transfer to Northstar High-Yield Savings', merchant: 'Northstar Financial', category: 'Transfer' },
    { daysBack: 29, type: 'deposit', direction: 'credit', amount: 1850000, description: 'Payroll Direct Deposit — Meridian Analytics LLC', merchant: 'Meridian Analytics LLC', category: 'Income' },
    { daysBack: 24, type: 'purchase', direction: 'debit', amount: 128000, description: 'Card Purchase — Delta Air Lines', merchant: 'Delta Air Lines', category: 'Travel' },
    { daysBack: 18, type: 'purchase', direction: 'debit', amount: 34200, description: 'Card Purchase — The Capital Grille', merchant: 'The Capital Grille', category: 'Dining' },
    { daysBack: 12, type: 'bill_pay', direction: 'debit', amount: 98600, description: 'Credit Card Payment — Northstar Financial', merchant: 'Northstar Financial', category: 'Payment' },
    { daysBack: 7, type: 'purchase', direction: 'debit', amount: 21500, description: 'Card Purchase — Apple Store', merchant: 'Apple Store', category: 'Shopping' },
    { daysBack: 2, type: 'deposit', direction: 'credit', amount: 1850000, description: 'Payroll Direct Deposit — Meridian Analytics LLC', merchant: 'Meridian Analytics LLC', category: 'Income' },
  ];

  let runningChecking = 96700000;
  const checkingDeltas = checkingTx.map((t) => (t.direction === 'credit' ? t.amount : -t.amount));
  const totalDelta = checkingDeltas.reduce((a, b) => a + b, 0);
  runningChecking = 96700000 - totalDelta;

  const checkingDocs = [];
  for (const t of checkingTx) {
    runningChecking += (t.direction === 'credit' ? t.amount : -t.amount);
    checkingDocs.push({
      accountId: checking._id,
      cardId: t.type === 'purchase' ? debitCard._id : null,
      type: t.type,
      direction: t.direction,
      amountCents: t.amount,
      description: t.description,
      merchant: t.merchant,
      category: t.category,
      balanceAfterCents: runningChecking,
      status: 'posted',
      transferId: null,
      createdAt: daysAgo(t.daysBack),
    });
  }
  await Transaction.insertMany(checkingDocs);

  // --- Transactions: savings ---
  const savingsTx = [
    { daysBack: 45, type: 'transfer', direction: 'credit', amount: 250000, description: 'Transfer from Northstar Premier Checking', merchant: 'Northstar Financial', category: 'Transfer' },
    { daysBack: 30, type: 'interest', direction: 'credit', amount: 65300, description: 'Interest Payment', merchant: 'Northstar Financial', category: 'Interest' },
    { daysBack: 1, type: 'interest', direction: 'credit', amount: 65312, description: 'Interest Payment', merchant: 'Northstar Financial', category: 'Interest' },
  ];
  let runningSavings = 184320075 - savingsTx.reduce((a, t) => a + t.amount, 0);
  const savingsDocs = [];
  for (const t of savingsTx) {
    runningSavings += t.amount;
    savingsDocs.push({
      accountId: savings._id,
      cardId: null,
      type: t.type,
      direction: t.direction,
      amountCents: t.amount,
      description: t.description,
      merchant: t.merchant,
      category: t.category,
      balanceAfterCents: runningSavings,
      status: 'posted',
      transferId: null,
      createdAt: daysAgo(t.daysBack),
    });
  }
  await Transaction.insertMany(savingsDocs);

  // --- Transactions: credit card ---
  const creditTx = [
    { daysBack: 38, amount: 45000, description: 'Card Purchase — Marriott Hotels', merchant: 'Marriott Hotels', category: 'Travel' },
    { daysBack: 27, amount: 32000, description: 'Card Purchase — Best Buy', merchant: 'Best Buy', category: 'Electronics' },
    { daysBack: 20, amount: 15600, description: 'Card Purchase — Uber', merchant: 'Uber', category: 'Transportation' },
    { daysBack: 12, amount: 98600, direction: 'credit', description: 'Payment Received — Thank You', merchant: 'Northstar Financial', category: 'Payment' },
    { daysBack: 9, amount: 27500, description: 'Card Purchase — Total Wine & More', merchant: 'Total Wine & More', category: 'Shopping' },
    { daysBack: 3, amount: 16955, description: 'Card Purchase — Equinox Fitness', merchant: 'Equinox Fitness', category: 'Health & Fitness' },
  ];
  let runningCredit = 1234055 - creditTx.reduce((a, t) => a + (t.direction === 'credit' ? -t.amount : t.amount), 0);
  const creditDocs = [];
  for (const t of creditTx) {
    const direction = t.direction || 'debit';
    runningCredit += (direction === 'credit' ? -t.amount : t.amount);
    creditDocs.push({
      accountId: null,
      cardId: creditCard._id,
      type: direction === 'credit' ? 'payment' : 'purchase',
      direction,
      amountCents: t.amount,
      description: t.description,
      merchant: t.merchant,
      category: t.category,
      balanceAfterCents: runningCredit,
      status: 'posted',
      transferId: null,
      createdAt: daysAgo(t.daysBack),
    });
  }
  await Transaction.insertMany(creditDocs);

  // --- Statements ---
  const statementDocs = [];
  for (let i = 3; i >= 1; i--) {
    const periodEnd = daysAgo(i * 30 - 30);
    const periodStart = daysAgo(i * 30);
    statementDocs.push({
      accountId: checking._id,
      cardId: null,
      label: `Northstar Premier Checking — Statement ${periodStart.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
      periodStart,
      periodEnd,
      openingBalanceCents: 96700000 - (i * 150000),
      closingBalanceCents: 96700000 - ((i - 1) * 150000),
      totalCreditsCents: 1850000,
      totalDebitsCents: 1700000,
      generatedAt: periodEnd,
    });
    statementDocs.push({
      accountId: null,
      cardId: creditCard._id,
      label: `Northstar Credit Card — Statement ${periodStart.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
      periodStart,
      periodEnd,
      openingBalanceCents: 900000 + (i * 40000),
      closingBalanceCents: 900000 + ((i - 1) * 40000),
      totalCreditsCents: 98600,
      totalDebitsCents: 138600,
      generatedAt: periodEnd,
    });
  }
  await Statement.insertMany(statementDocs);

  // --- Rewards ---
  const rewards = await Rewards.create({
    userId: user._id,
    cardId: creditCard._id,
    pointsBalance: 184230,
    tier: 'Platinum',
    pointsToNextTier: 65770,
    updatedAt: new Date(),
  });

  await RewardsActivity.insertMany([
    { rewardId: rewards._id, points: 4500, description: 'Points earned — Marriott Hotels', createdAt: daysAgo(38) },
    { rewardId: rewards._id, points: 3200, description: 'Points earned — Best Buy', createdAt: daysAgo(27) },
    { rewardId: rewards._id, points: 1560, description: 'Points earned — Uber', createdAt: daysAgo(20) },
    { rewardId: rewards._id, points: 2750, description: 'Points earned — Total Wine & More', createdAt: daysAgo(9) },
    { rewardId: rewards._id, points: 1696, description: 'Points earned — Equinox Fitness', createdAt: daysAgo(3) },
    { rewardId: rewards._id, points: 25000, description: 'Platinum tier anniversary bonus', createdAt: daysAgo(60) },
  ]);

  // --- Notifications ---
  await Notification.insertMany([
    {
      userId: user._id,
      title: 'Your checking statement is ready',
      body: 'Your Northstar Premier Checking statement for last month is now available to view.',
      category: 'statement',
      isRead: false,
      createdAt: daysAgo(2),
    },
    {
      userId: user._id,
      title: 'New sign-in to your account',
      body: 'We noticed a new sign-in to your Northstar Financial account. If this was not you, please contact support immediately.',
      category: 'security',
      isRead: false,
      createdAt: daysAgo(1),
    },
    {
      userId: user._id,
      title: 'Transfer completed',
      body: 'Your transfer of $2,500.00 to Northstar High-Yield Savings has completed successfully.',
      category: 'transfer',
      isRead: true,
      createdAt: daysAgo(33),
    },
    {
      userId: user._id,
      title: 'You reached Platinum tier',
      body: 'Congratulations — your Northstar Rewards account has reached Platinum tier.',
      category: 'rewards',
      isRead: true,
      createdAt: daysAgo(60),
    },
  ]);

  console.log('Seed complete.');
  console.log(`  User: ${DEMO_USERNAME} (password set from DEMO_PASSWORD in .env — not logged)`);
  console.log(`  Checking: ${checking.accountNumber} — $${(checking.balanceCents / 100).toFixed(2)}`);
  console.log(`  Savings:  ${savings.accountNumber} — $${(savings.balanceCents / 100).toFixed(2)}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
