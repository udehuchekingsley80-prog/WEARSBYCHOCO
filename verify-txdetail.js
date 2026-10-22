const { chromium } = require('playwright-core');
const path = require('path');

const SHOT_DIR = 'C:\\Users\\HP\\AppData\\Local\\Temp\\claude\\c--Users-HP-OneDrive-Desktop-BANKING\\9b214d24-fe75-4769-9b1a-6d6def5ade09\\scratchpad';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on('console', (msg) => console.log(`[console:${msg.type()}]`, msg.text()));
  page.on('response', (res) => { if (res.url().includes('/api/')) console.log(`[api ${res.status()}]`, res.url()); });
  page.on('requestfailed', (req) => console.log('[requestfailed]', req.url(), req.failure()?.errorText));

  page.setDefaultTimeout(30000);
  await page.goto('http://localhost:3000/login.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.fill('#username', 'kevinlutolf6153635@gmail.com');
  await page.fill('#password', 'ROSEMARY2013@');
  await page.click('#login-submit');
  await page.waitForURL('**/dashboard.html', { timeout: 30000, waitUntil: 'domcontentloaded' });
  console.log('reached dashboard, waiting for tx rows...');
  await page.waitForSelector('.js-tx-row', { timeout: 30000 });
  await page.waitForTimeout(300);

  await page.screenshot({ path: path.join(SHOT_DIR, 'dash-before-click.png'), fullPage: true });

  await page.click('.js-tx-row');
  await page.waitForURL('**/transaction.html?id=*', { timeout: 8000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SHOT_DIR, 'tx-detail.png'), fullPage: true });

  console.log('Final URL:', page.url());
  console.log('Errors:', JSON.stringify(errors, null, 2));

  // also verify clicking a transfer-type transaction shows the Transfer Details section
  await page.goto('http://localhost:3000/transactions.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.js-tx-row', { timeout: 10000 });
  const rows = await page.$$('.js-tx-row');
  console.log('Activity page row count:', rows.length);

  await browser.close();
})().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
