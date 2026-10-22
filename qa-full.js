const { chromium } = require('playwright-core');
const path = require('path');

const SHOT_DIR = 'C:\\Users\\HP\\AppData\\Local\\Temp\\claude\\c--Users-HP-OneDrive-Desktop-BANKING\\9b214d24-fe75-4769-9b1a-6d6def5ade09\\scratchpad\\qa';
require('fs').mkdirSync(SHOT_DIR, { recursive: true });

const pages = [
  ['dashboard', 'dashboard.html'],
  ['accounts', 'accounts.html'],
  ['cards', 'cards.html'],
  ['transfer', 'transfer.html'],
  ['transactions', 'transactions.html'],
  ['statements', 'statements.html'],
  ['notifications', 'notifications.html'],
  ['rewards', 'rewards.html'],
  ['profile', 'profile.html'],
];

const allErrors = {};

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`); });
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', (req) => {
    if (!req.url().includes('favicon')) errors.push(`[requestfailed] ${req.url()} ${req.failure()?.errorText}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon')) errors.push(`[http ${res.status()}] ${res.url()}`);
  });

  // index + login first
  await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOT_DIR, '00-index.png'), fullPage: true });

  await page.goto('http://localhost:3000/login.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOT_DIR, '01-login.png'), fullPage: true });

  await page.fill('#username', 'kevinlutolf6153635@gmail.com');
  await page.fill('#password', 'ROSEMARY2013@');
  await page.click('#login-submit');
  await page.waitForURL('**/dashboard.html', { timeout: 15000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  for (const [name, file] of pages) {
    errors.length = 0;
    await page.goto(`http://localhost:3000/${file}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: true });
    allErrors[name] = [...errors];
  }

  // Mobile viewport pass on dashboard + cards
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto('http://localhost:3000/login.html', { waitUntil: 'domcontentloaded' });
  await mobilePage.fill('#username', 'udehuchekingsley80@gmail.com');
  await mobilePage.fill('#password', 'ROSEMARY2013@');
  await mobilePage.click('#login-submit');
  await mobilePage.waitForURL('**/dashboard.html', { timeout: 15000, waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(SHOT_DIR, 'mobile-dashboard.png'), fullPage: true });
  await mobilePage.goto('http://localhost:3000/cards.html', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(SHOT_DIR, 'mobile-cards.png'), fullPage: true });

  console.log('=== ERRORS BY PAGE ===');
  console.log(JSON.stringify(allErrors, null, 2));

  await browser.close();
})().catch((err) => {
  console.error('QA SCRIPT FAILED:', err.message);
  process.exit(1);
});
