const { chromium } = require('playwright-core');
const path = require('path');

const SHOT_DIR = 'C:\\Users\\HP\\AppData\\Local\\Temp\\claude\\c--Users-HP-OneDrive-Desktop-BANKING\\9b214d24-fe75-4769-9b1a-6d6def5ade09\\scratchpad';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(30000);

  await page.goto('http://localhost:3000/login.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.fill('#username', 'kevinlutolf6153635@gmail.com');
  await page.fill('#password', 'ROSEMARY2013@');
  await page.click('#login-submit');
  await page.waitForURL('**/dashboard.html', { timeout: 30000, waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.js-tx-row', { timeout: 30000 });

  const txId = await page.$eval('.js-tx-row', (el) => el.dataset.id);
  console.log('txId:', txId);

  await page.goto(`http://localhost:3000/transaction.html?id=${txId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.getElementById('sidebar-slot').innerHTML.length > 0, { timeout: 15000 });
  await page.waitForFunction(() => !document.getElementById('tx-content').innerHTML.includes('skeleton-row'), { timeout: 15000 });
  await page.waitForTimeout(400);

  const sidebarHtmlLen = await page.$eval('#sidebar-slot', (el) => el.innerHTML.length);
  console.log('sidebar innerHTML length:', sidebarHtmlLen);

  await page.screenshot({ path: path.join(SHOT_DIR, 'tx-detail-2.png'), fullPage: true });
  console.log('done');

  await browser.close();
})().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
