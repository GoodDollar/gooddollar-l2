import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base = 'http://127.0.0.1:3211';
const routes = [
  '/',
  '/activity',
  '/explore',
  '/stocks',
  '/stocks/portfolio',
  '/stocks/watchlist',
  '/stocks/AAPL',
  '/perps',
  '/perps/portfolio',
  '/predict',
  '/predict/portfolio',
  '/lend',
  '/yield',
  '/stable',
  '/pool',
  '/bridge',
  '/portfolio',
  '/analytics',
  '/agents',
  '/agents/register'
];

await fs.mkdir('tmp/review-iteration-11/screens', { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
for (const route of routes) {
  const url = `${base}${route}`;
  const name = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '__');
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `tmp/review-iteration-11/screens/${name}.png`, fullPage: true });
    console.log(`OK ${route}`);
  } catch (err) {
    console.log(`ERR ${route} ${err.message}`);
  }
}
await browser.close();
