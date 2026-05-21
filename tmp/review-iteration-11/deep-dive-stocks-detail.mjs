import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = 'tmp/review-iteration-11/deep-dive';
await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
});

await page.goto('http://127.0.0.1:3211/stocks/AAPL', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/00-initial.png`, fullPage: true });

// Exercise symbol switcher options
const symbolInput = page.getByPlaceholder('Type ticker or company');
await symbolInput.fill('MSFT');
await page.keyboard.press('Enter');
await page.waitForURL(/\/stocks\/MSFT/, { timeout: 15000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${outDir}/01-symbol-msft.png`, fullPage: true });

await symbolInput.fill('AAPL');
await page.keyboard.press('Enter');
await page.waitForURL(/\/stocks\/AAPL/, { timeout: 15000 });
await page.waitForTimeout(1000);

// Exercise chart timeframe buttons
for (const tf of ['1D','1W','1M','3M','6M','1Y','5Y','ALL']) {
  const btn = page.getByRole('button', { name: new RegExp(`^${tf}$`) }).first();
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForTimeout(300);
  }
}
await page.screenshot({ path: `${outDir}/02-chart-all-timeframes.png`, fullPage: true });

// Exercise order side and order type toggles + validation states
await page.getByRole('button', { name: /^sell$/i }).first().click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${outDir}/03-sell-gated.png`, fullPage: true });

const switchBuy = page.getByTestId('stocks-sell-gated-switch-to-buy');
if (await switchBuy.isVisible()) {
  await switchBuy.click();
}
await page.waitForTimeout(200);

await page.getByRole('button', { name: /^limit$/i }).first().click();
await page.waitForTimeout(200);
const amountInput = page.getByTestId('stocks-order-amount-input');
const limitInput = page.getByPlaceholder('0.00').first();
await amountInput.fill('100');
await limitInput.fill('0');
await page.waitForTimeout(250);
await page.screenshot({ path: `${outDir}/04-limit-invalid-price.png`, fullPage: true });

await limitInput.fill('220.15');
await page.waitForTimeout(250);
await page.screenshot({ path: `${outDir}/05-limit-valid-price.png`, fullPage: true });

await page.getByRole('button', { name: /^market$/i }).first().click();
await page.waitForTimeout(250);
await page.screenshot({ path: `${outDir}/06-market-after-limit.png`, fullPage: true });

await fs.writeFile(`${outDir}/errors.log`, errors.join('\n'), 'utf8');
console.log(`errors=${errors.length}`);
if (errors.length) {
  console.log(errors.slice(0, 20).join('\n'));
}
await browser.close();
