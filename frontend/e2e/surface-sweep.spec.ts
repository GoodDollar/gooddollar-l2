import { test, expect } from '@playwright/test';

const routes = [
  '/', '/explore', '/pool', '/bridge', '/stocks', '/stocks/AAPL',
  '/predict', '/predict/create', '/perps', '/lend', '/stable',
  '/yield', '/agents', '/portfolio', '/governance', '/ubi-impact',
  '/activity', '/faucet', '/testnet-guide'
];

test('surface sweep - screenshot + console check', async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`[pageerror] ${err.message}`));

  for (const route of routes) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(500);
      const slug = route === '/' ? 'home' : route.replace(/\//g, '-').slice(1);
      await page.screenshot({ path: `/tmp/sweep-${slug}.png`, fullPage: false });
    } catch (e) {
      console.log(`FAILED: ${route} - ${(e as Error).message}`);
    }
  }

  const criticalErrors = errors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('web3modal') &&
    !e.includes('walletconnect') &&
    !e.includes('WalletConnect') &&
    !e.includes('pulse.walletconnect') &&
    !e.includes('ERR_CONNECTION_REFUSED') &&
    !e.includes('net::ERR') &&
    !e.includes('api.web3modal') &&
    !e.includes('Loading CSS chunk') &&
    !e.includes('No data found') &&
    !e.includes('getaddrinfo') &&
    !e.includes('cloudflare') &&
    !e.includes('Hydration')
  );

  console.log(`\n=== CONSOLE ERROR SUMMARY ===`);
  console.log(`Total console errors: ${errors.length}`);
  console.log(`Critical (filtered): ${criticalErrors.length}`);
  if (criticalErrors.length > 0) {
    criticalErrors.slice(0, 20).forEach(e => console.log(e));
  }
});
