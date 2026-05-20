import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base = 'http://127.0.0.1:3100';
const outDir = 'tmp/review-iter9-journeys';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1512, height: 982 } });
const page = await context.newPage();
const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

const observations = [];

async function shot(name) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
}

async function journey1() {
  await page.goto(`${base}/stocks`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot('j1-stocks-landing');
  const hasSearch = await page.getByPlaceholder(/search stocks/i).isVisible().catch(() => false);
  const hasRows = await page.locator('table tbody tr').count();
  observations.push({ journey: 'new-user-explores-stocks', hasSearch, hasRows });
}

async function journey2() {
  await page.goto(`${base}/stocks`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const firstStock = page.locator('table tbody tr').first();
  await firstStock.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(900);
  await shot('j2-stock-detail-from-list');
  const url = page.url();
  const hasTradeCard = await page.getByText(/trade .*stock|place order|buy/i).first().isVisible().catch(() => false);
  const hasBreadcrumbBack = await page.getByRole('link', { name: /back/i }).count();
  observations.push({ journey: 'research-stock-from-list', url, hasTradeCard, hasBreadcrumbBack });
}

async function journey3() {
  await page.goto(`${base}/stocks/portfolio`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await shot('j3-stocks-portfolio');
  const text = await page.locator('body').innerText();
  observations.push({
    journey: 'user-checks-stock-portfolio',
    hasCriticalWhenEmpty: /0%\s*[-–]\s*Critical/.test(text),
    hasNoPositions: /No positions yet/i.test(text)
  });
}

async function journey4() {
  await page.goto(`${base}/portfolio`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await shot('j4-global-portfolio');
  const stocksCta = page.getByRole('link', { name: /browse stocks/i });
  const hasStocksCta = await stocksCta.count();
  if (hasStocksCta) {
    await stocksCta.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await shot('j4-portfolio-to-stocks');
  }
  observations.push({ journey: 'portfolio-to-stocks-discovery', hasStocksCta: Boolean(hasStocksCta), endUrl: page.url() });
}

async function extraChecks() {
  await page.goto(`${base}/stocks/%252F..%252F%00`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await shot('extra-malformed-ticker');
  const txt = await page.locator('body').innerText();
  observations.push({
    journey: 'malformed-ticker-resilience',
    showsRawEncodedPayload: /%252F|%00|\.{2}/.test(txt),
    hasFriendlyNotFoundCopy: /Stock Not Found|Back to Stocks/i.test(txt)
  });
}

await journey1();
await journey2();
await journey3();
await journey4();
await extraChecks();

await browser.close();

const report = { observations, consoleErrors };
await fs.writeFile(`${outDir}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
