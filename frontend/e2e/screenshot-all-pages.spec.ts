import { test } from '@playwright/test';

const pages = [
  { name: 'swap', path: '/' },
  { name: 'explore', path: '/explore' },
  { name: 'perps', path: '/perps' },
  { name: 'perps-leaderboard', path: '/perps/leaderboard' },
  { name: 'perps-portfolio', path: '/perps/portfolio' },
  { name: 'predict', path: '/predict' },
  { name: 'predict-create', path: '/predict/create' },
  { name: 'predict-portfolio', path: '/predict/portfolio' },
  { name: 'lend', path: '/lend' },
  { name: 'stable', path: '/stable' },
  { name: 'stocks', path: '/stocks' },
  { name: 'stocks-portfolio', path: '/stocks/portfolio' },
  { name: 'pool', path: '/pool' },
  { name: 'bridge', path: '/bridge' },
  { name: 'portfolio', path: '/portfolio' },
  { name: 'yield', path: '/yield' },
  { name: 'agents', path: '/agents' },
  { name: 'agents-register', path: '/agents/register' },
  { name: 'governance', path: '/governance' },
  { name: 'governance-analytics', path: '/governance/analytics' },
  { name: 'ubi-impact', path: '/ubi-impact' },
  { name: 'activity', path: '/activity' },
  { name: 'faucet', path: '/faucet' },
  { name: 'testnet-guide', path: '/testnet-guide' },
];

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const OUT = '../.autobuilder/review-screenshots/baseline';

for (const vp of viewports) {
  for (const pg of pages) {
    test(`${pg.name} @ ${vp.name} (${vp.width}px)`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await ctx.newPage();
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`${BASE}${pg.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${OUT}/${pg.name}-${vp.name}.png`,
        fullPage: true,
      });
      if (errors.length > 0) {
        console.log(`CONSOLE ERRORS on ${pg.path} @ ${vp.name}:`, errors);
      }
      await ctx.close();
    });
  }
}
