import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
await fs.mkdir('tmp/review-iter9-mobile', { recursive: true });

for (const route of ['/stocks', '/stocks/AAPL', '/stocks/portfolio']) {
  await page.goto(`http://127.0.0.1:3100${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const name = route.replace(/\//g, '_').replace(/^_/, '') || 'home';
  await page.screenshot({ path: `tmp/review-iter9-mobile/${name}.png`, fullPage: true });
}

await browser.close();
console.log('done');
