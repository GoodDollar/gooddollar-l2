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

const OUT = '../.autobuilder/review-screenshots/baseline';

// Desktop-only review captures; avoid duplicate runs on mobile-chrome project.
test.describe.configure({ mode: 'parallel' });

for (const pg of pages) {
  test(`screenshot-${pg.name}`, async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const origin = baseURL ?? `http://localhost:${process.env.E2E_PORT ?? '3119'}`;
    await page.goto(`${origin}${pg.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
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
