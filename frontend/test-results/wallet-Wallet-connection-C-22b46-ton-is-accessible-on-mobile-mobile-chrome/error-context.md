# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wallet.spec.ts >> Wallet connection >> Connect Wallet button is accessible on mobile
- Location: e2e/wallet.spec.ts:27:7

# Error details

```
Error: expect(locator).toBeAttached() failed

Locator: getByRole('button', { name: /connect wallet/i })
Expected: attached
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeAttached" with timeout 5000ms
  - waiting for getByRole('button', { name: /connect wallet/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e7]: G$
          - generic [ref=e8]: GoodDollar
        - generic [ref=e9]:
          - link "Portfolio" [ref=e10] [cursor=pointer]:
            - /url: /portfolio
            - img [ref=e11]
          - button "Switch to light mode" [ref=e13] [cursor=pointer]:
            - img [ref=e14]
          - button "Recent activity" [ref=e21] [cursor=pointer]:
            - img [ref=e22]
          - button "Open menu" [ref=e24] [cursor=pointer]:
            - img [ref=e25]
          - button [ref=e27] [cursor=pointer]:
            - img [ref=e29]
    - generic [ref=e32]:
      - paragraph [ref=e33]: ♥$2.4M distributed to 640K+ people through UBI — funded by your trades
      - button "Dismiss UBI banner" [ref=e34] [cursor=pointer]:
        - img [ref=e35]
    - main [ref=e37]:
      - generic [ref=e39]:
        - generic [ref=e40]:
          - heading "Trade. Predict. Invest. Fund UBI." [level=1] [ref=e41]
          - paragraph [ref=e42]: Every swap, prediction, and trade on GoodDollar automatically funds universal basic income for verified humans worldwide.
          - paragraph [ref=e43]:
            - generic [ref=e45]: $2.4M
            - text: already distributed to
            - generic [ref=e46]: 640K+
            - text: people worldwide
        - generic [ref=e47]:
          - generic [ref=e48]:
            - generic [ref=e49]:
              - generic [ref=e50]:
                - text: 1 ETH =
                - generic [ref=e51]: 295,338 G$
              - generic [ref=e52]: ▼ 4.77%
            - generic [ref=e53]:
              - button "1D" [ref=e54] [cursor=pointer]
              - button "1W" [ref=e55] [cursor=pointer]
              - button "1M" [ref=e56] [cursor=pointer]
          - img "ETH/G$ price chart" [ref=e58]
        - generic [ref=e63]:
          - generic [ref=e64]:
            - heading "Swap" [level=2] [ref=e65]
            - generic [ref=e66]:
              - button "0.1% funds UBI" [ref=e68] [cursor=pointer]:
                - img [ref=e69]
                - text: 0.1% funds UBI
              - button "Settings" [ref=e72] [cursor=pointer]:
                - img [ref=e73]
          - generic [ref=e76]:
            - generic [ref=e78]: You pay
            - generic [ref=e79]:
              - textbox "Amount to swap (ETH)" [ref=e80]:
                - /placeholder: "0"
              - button "ETH" [ref=e81] [cursor=pointer]:
                - img [ref=e83]
                - generic [ref=e91]: ETH
                - img [ref=e92]
          - button [ref=e95] [cursor=pointer]:
            - img [ref=e96]
          - generic [ref=e98]:
            - generic [ref=e100]: You receive
            - generic [ref=e101]:
              - generic [ref=e103]: "0"
              - button "G$" [ref=e104] [cursor=pointer]:
                - img [ref=e106]:
                  - generic [ref=e108]: G$
                - generic [ref=e109]: G$
                - img [ref=e110]
          - generic [ref=e112]:
            - button "Enter an Amount" [ref=e113]
            - paragraph [ref=e114]: Try swapping ETH → G$ — 0.1% of fees fund basic income for 640K+ people
        - generic [ref=e115]:
          - heading "How It Works" [level=2] [ref=e116]
          - generic [ref=e117]:
            - generic [ref=e118]:
              - generic [ref=e119]: "1"
              - img [ref=e121]
              - heading "Trade Any Asset" [level=3] [ref=e123]
              - paragraph [ref=e124]: Swap tokens, trade stocks, predict events, or trade perpetual futures — all on one platform.
            - generic [ref=e125]:
              - generic [ref=e126]: "2"
              - img [ref=e128]
              - heading "Fees Fund UBI" [level=3] [ref=e130]
              - paragraph [ref=e131]: 33% of every trading fee goes directly to the GoodDollar UBI pool — automatically.
            - generic [ref=e132]:
              - generic [ref=e133]: "3"
              - img [ref=e135]
              - heading "People Earn Income" [level=3] [ref=e137]
              - paragraph [ref=e138]: Verified humans worldwide receive daily universal basic income payouts from the pool.
        - generic [ref=e140]:
          - heading "Your Fees, Their Income" [level=2] [ref=e141]
          - paragraph [ref=e142]: Universal Basic Income (UBI) is a regular cash payment to every verified human, regardless of employment. GoodDollar has distributed UBI to 640,000+ people worldwide since 2020 — funded by platform trading fees.
          - generic [ref=e143]:
            - generic [ref=e144]:
              - generic [ref=e145]:
                - img [ref=e147]
                - generic [ref=e149]: Your Trade
              - img [ref=e150]
            - generic [ref=e152]:
              - generic [ref=e153]:
                - img [ref=e155]
                - generic [ref=e157]: 33% Fee
              - img [ref=e158]
            - generic [ref=e160]:
              - generic [ref=e161]:
                - img [ref=e163]
                - generic [ref=e165]: UBI Pool
              - img [ref=e166]
            - generic [ref=e169]:
              - img [ref=e171]
              - generic [ref=e173]: 640K+ People
        - generic [ref=e174]:
          - heading "Explore the Platform" [level=2] [ref=e175]
          - paragraph [ref=e176]: Every product on GoodDollar routes fees to universal basic income.
          - generic [ref=e177]:
            - link "GoodSwap Swap any token with 0.1% fees funding UBI. Start Swapping →" [ref=e178] [cursor=pointer]:
              - /url: /swap
              - generic [ref=e179]:
                - img [ref=e181]
                - generic [ref=e183]: GoodSwap
              - paragraph [ref=e184]: Swap any token with 0.1% fees funding UBI.
              - generic [ref=e185]: Start Swapping →
            - link "GoodStocks Trade synthetic equities 24/7. Fractional shares. Every trade funds UBI. View Stocks →" [ref=e186] [cursor=pointer]:
              - /url: /stocks
              - generic [ref=e187]:
                - img [ref=e189]
                - generic [ref=e191]: GoodStocks
              - paragraph [ref=e192]: Trade synthetic equities 24/7. Fractional shares. Every trade funds UBI.
              - generic [ref=e193]: View Stocks →
            - link "GoodPredict Bet on real-world events. Every trade funds UBI. View Markets →" [ref=e194] [cursor=pointer]:
              - /url: /predict
              - generic [ref=e195]:
                - img [ref=e197]
                - generic [ref=e199]: GoodPredict
              - paragraph [ref=e200]: Bet on real-world events. Every trade funds UBI.
              - generic [ref=e201]: View Markets →
            - link "GoodPerps Trade perpetual futures with up to 50x leverage. Every fee funds UBI. Trade Perps →" [ref=e202] [cursor=pointer]:
              - /url: /perps
              - generic [ref=e203]:
                - img [ref=e205]
                - generic [ref=e207]: GoodPerps
              - paragraph [ref=e208]: Trade perpetual futures with up to 50x leverage. Every fee funds UBI.
              - generic [ref=e209]: Trade Perps →
            - link "GoodLend Supply and borrow assets. Earn interest while funding UBI. Lend Now →" [ref=e210] [cursor=pointer]:
              - /url: /lend
              - generic [ref=e211]:
                - img [ref=e213]
                - generic [ref=e215]: GoodLend
              - paragraph [ref=e216]: Supply and borrow assets. Earn interest while funding UBI.
              - generic [ref=e217]: Lend Now →
            - link "GoodStable Mint gUSD stablecoin by locking collateral. 33% of fees fund UBI. Open Vault →" [ref=e218] [cursor=pointer]:
              - /url: /stable
              - generic [ref=e219]:
                - img [ref=e221]
                - generic [ref=e223]: GoodStable
              - paragraph [ref=e224]: Mint gUSD stablecoin by locking collateral. 33% of fees fund UBI.
              - generic [ref=e225]: Open Vault →
        - button "Start Trading →" [ref=e227] [cursor=pointer]:
          - text: Start Trading
          - generic [ref=e228]: →
        - generic [ref=e230]:
          - generic [ref=e231]:
            - generic [ref=e232]: $2.4M
            - generic [ref=e233]: UBI Distributed
          - generic [ref=e234]:
            - generic [ref=e235]: 640K+
            - generic [ref=e236]: Daily Claimers
          - generic [ref=e237]:
            - generic [ref=e238]: 1.2M
            - generic [ref=e239]: Total Swaps
    - contentinfo [ref=e240]:
      - generic [ref=e241]:
        - paragraph [ref=e242]: Powered by GoodDollar L2
        - navigation [ref=e243]:
          - link "Docs" [ref=e244] [cursor=pointer]:
            - /url: https://docs.gooddollar.org
          - link "GitHub" [ref=e245] [cursor=pointer]:
            - /url: https://github.com/GoodDollar
          - link "Community" [ref=e246] [cursor=pointer]:
            - /url: https://community.gooddollar.org
    - region "Notifications (F8)":
      - list
  - alert [ref=e247]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Wallet connection', () => {
  4  |   // Connect Wallet button lives in the desktop header; run at desktop viewport
  5  |   test.use({ viewport: { width: 1280, height: 720 } })
  6  | 
  7  |   test.beforeEach(async ({ page }) => {
  8  |     await page.goto('/')
  9  |   })
  10 | 
  11 |   test('Connect Wallet button is visible in header', async ({ page }) => {
  12 |     await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible()
  13 |   })
  14 | 
  15 |   test('clicking Connect Wallet shows the testnet launch toast', async ({ page }) => {
  16 |     await page.getByRole('button', { name: /connect wallet/i }).click()
  17 |     await expect(page.getByText(/testnet launching soon/i)).toBeVisible()
  18 |   })
  19 | 
  20 |   test('wallet toast disappears after ~3 seconds', async ({ page }) => {
  21 |     await page.getByRole('button', { name: /connect wallet/i }).click()
  22 |     await expect(page.getByText(/testnet launching soon/i)).toBeVisible()
  23 |     // Toast auto-dismisses after 3s
  24 |     await expect(page.getByText(/testnet launching soon/i)).not.toBeVisible({ timeout: 5000 })
  25 |   })
  26 | 
  27 |   test('Connect Wallet button is accessible on mobile', async ({ page }) => {
  28 |     await page.setViewportSize({ width: 390, height: 844 })
  29 |     await page.reload()
  30 |     // On mobile the label may be hidden but button should still exist
  31 |     const btn = page.locator('button').filter({ hasText: '' }).first()
  32 |     const connectBtn = page.getByRole('button', { name: /connect wallet/i })
  33 |     // The button element should be in the DOM even if text is visually hidden
> 34 |     await expect(connectBtn).toBeAttached()
     |                              ^ Error: expect(locator).toBeAttached() failed
  35 |   })
  36 | 
  37 |   test('swap button requires wallet when no wallet connected', async ({ page }) => {
  38 |     const swapCard = page.locator('#swap-card')
  39 |     // The swap action area should be visible
  40 |     await expect(swapCard).toBeVisible()
  41 |     // Without wallet, should show connect prompt or disabled state — not crash
  42 |     const actionArea = swapCard.locator('div.p-4.pt-3')
  43 |     await expect(actionArea).toBeVisible()
  44 |   })
  45 | })
  46 | 
  47 | test.describe('SwapCard wallet actions', () => {
  48 |   test.beforeEach(async ({ page }) => {
  49 |     await page.goto('/')
  50 |   })
  51 | 
  52 |   test('entering amount and clicking swap shows connect wallet prompt', async ({ page }) => {
  53 |     const input = page.locator('#swap-card input[inputmode="decimal"]')
  54 |     await input.fill('1')
  55 |     // There should be a swap/connect action button visible
  56 |     const swapActions = page.locator('#swap-card div.p-4.pt-3')
  57 |     await expect(swapActions).toBeVisible()
  58 |   })
  59 | })
  60 | 
```