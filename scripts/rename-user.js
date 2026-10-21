// One-time script: rename the account holder to Kevin Lutolf.
//
// It updates ONLY the name fields on the EXISTING user document, plus the
// card-holder name on that same user's own cards. It never deletes or
// recreates the user, and never touches balances, accounts, transactions,
// statements, rewards, credentials (password/PIN hashes) or any other
// record.
//
// Usage:  node scripts/rename-user.js
require('dotenv').config();
const mongoose = require('mongoose');
const { User, Card } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/northstar_financial';

const FIRST_NAME = 'Kevin';
const LAST_NAME = 'Lutolf';
const CARD_HOLDER = 'KEVIN LUTOLF';

// The seed used a placeholder contact email built from the old name. Only
// that legacy placeholder is rewritten — a real on-file email is left alone.
const LEGACY_EMAIL = /leonard/i;
const NEW_EMAIL = 'kevin.lutolf@northstarfinancial.example';

function redactUri(uri) {
  return String(uri).replace(/\/\/[^@/]+@/, '//***:***@');
}

async function run() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected to ${redactUri(MONGODB_URI)}`);

  const demoUsername = (process.env.DEMO_USERNAME || '').toLowerCase();
  const user = (demoUsername && await User.findOne({ username: demoUsername }))
    || await User.findOne({});

  if (!user) {
    throw new Error('No user document found — there is nothing to rename.');
  }

  console.log(`Target user: "${user.username}" (${user._id})`);
  console.log(`  before: title="${user.title}" firstName="${user.firstName}" lastName="${user.lastName}" email="${user.email}"`);

  const fields = { firstName: FIRST_NAME, lastName: LAST_NAME };
  if (typeof user.email === 'string' && LEGACY_EMAIL.test(user.email)) {
    fields.email = NEW_EMAIL;
    console.log('  legacy seeded contact email detected — updating it to match the new name');
  } else {
    console.log('  contact email left untouched (not the legacy seeded placeholder)');
  }

  const userResult = await User.updateOne({ _id: user._id }, { $set: fields });
  console.log(`  user:  ${userResult.modifiedCount} document(s) modified`);

  const cardResult = await Card.updateMany({ userId: user._id }, { $set: { cardHolder: CARD_HOLDER } });
  console.log(`  cards: ${cardResult.modifiedCount} document(s) modified`);

  const after = await User.findById(user._id).select('username title firstName lastName email');
  console.log(`  after:  title="${after.title}" firstName="${after.firstName}" lastName="${after.lastName}" email="${after.email}"`);

  const cards = await Card.find({ userId: user._id }).select('type cardHolder status');
  cards.forEach((c) => console.log(`  card:   ${c.type} — cardHolder="${c.cardHolder}" (${c.status})`));

  console.log('Done. No user was deleted or recreated, and no balances, accounts, transactions or credentials were modified.');

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Rename failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch (ignored) { /* already disconnected */ }
  process.exit(1);
});
