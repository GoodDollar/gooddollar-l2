import { test } from '@playwright/test';

const pages = [
  { name: 'swap', path: '/' },
  { name: 'stocks', path: '/stocks' },
  { name: 'stocks-portfolio', path: '/stocks/portfolio' },
  { name: 'perps', path: '/perps' },
  { name: 'lend', path: '/lend' },
  { name: 'yield', path: '/yield' },
  { name: 'portfolio', path: '/portfolio' },
  { name: 'explore', path: '/explore' },
];

const BASE = process.env.BASE_URL || 'http://localhost:3214';
const OUT = '../.autobuilder/review-screenshots/baseline';

for (const pg of pages) {
  test(`screenshot-${pg.name}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}${pg.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: `${OUT}/${pg.name}-desktop.png`,
      fullPage: true,
    });
    if (errors.length > 0) {
      console.log(`CONSOLE ERRORS on ${pg.path}:`, errors);
    }
    await ctx.close();
  });
}
