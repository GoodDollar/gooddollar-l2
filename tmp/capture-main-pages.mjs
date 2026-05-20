import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base = 'http://127.0.0.1:3100';
const routes = [
  '/', '/explore', '/pool', '/bridge', '/stocks', '/stocks/portfolio',
  '/predict', '/predict/portfolio', '/perps', '/perps/portfolio',
  '/lend', '/stable', '/yield', '/governance', '/agents', '/ubi-impact',
  '/activity', '/faucet', '/testnet-guide', '/invite', '/portfolio'
];

const outDir = 'tmp/review-iter9-screens';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });
const results = [];

for (const route of routes) {
  const url = `${base}${route}`;
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1200);
    const name = route === '/' ? 'home' : route.replace(/\//g, '_').replace(/^_/, '');
    const shot = `${outDir}/${name}.png`;
    await page.screenshot({ path: shot, fullPage: true });
    const bodyTextLen = await page.locator('body').innerText().then(t => t.trim().length).catch(() => 0);
    results.push({ route, status: response?.status() ?? null, shot, bodyTextLen });
  } catch (error) {
    results.push({ route, error: String(error) });
  }
}

await browser.close();
await fs.writeFile(`${outDir}/results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
