import { test } from '@playwright/test';

const pages = [
  ['/', 'home'],
  ['/testnet-guide', 'testnet-guide'],
  ['/faucet', 'faucet'],
  ['/swap', 'swap'],
  ['/explore', 'explore'],
  ['/perps', 'perps'],
  ['/predict', 'predict'],
  ['/lend', 'lend'],
  ['/stable', 'stable'],
  ['/stocks', 'stocks'],
  ['/portfolio', 'portfolio'],
  ['/activity', 'activity'],
  ['/ubi-impact', 'ubi-impact'],
  ['/governance', 'governance'],
  ['/agents', 'agents'],
];

for (const [path, name] of pages) {
  test(`screenshot ${name}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `/tmp/review-screenshots/${name}-1440.png`, fullPage: true });
  });
}
