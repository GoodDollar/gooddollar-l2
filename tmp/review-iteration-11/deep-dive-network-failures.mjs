import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const failed = [];
page.on('requestfailed', req => {
  failed.push({ url: req.url(), method: req.method(), error: req.failure()?.errorText });
});
await page.goto('http://127.0.0.1:3211/stocks/AAPL', { waitUntil: 'networkidle', timeout: 60000 });
await page.getByRole('button', { name: /^limit$/i }).first().click();
await page.waitForTimeout(2000);
console.log(JSON.stringify(failed, null, 2));
await browser.close();
