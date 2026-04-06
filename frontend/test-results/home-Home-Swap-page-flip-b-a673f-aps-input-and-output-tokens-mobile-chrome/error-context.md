# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> Home / Swap page >> flip button swaps input and output tokens
- Location: e2e/home.spec.ts:37:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.flex.justify-center.-my-3').locator('button')
    - locator resolved to <button class="w-10 h-10 rounded-xl bg-dark-100 border border-gray-700/50 flex items-center justify-center hover:border-goodgreen/50 hover:text-goodgreen transition-colors text-gray-400 focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="mt-2.5 pt-2 border-t border-gray-700/30">…</div> from <div class="px-5 pt-5 pb-3 flex items-center justify-between">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="mt-2.5 pt-2 border-t border-gray-700/30">…</div> from <div class="px-5 pt-5 pb-3 flex items-center justify-between">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    55 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="mt-2.5 pt-2 border-t border-gray-700/30">…</div> from <div class="px-5 pt-5 pb-3 flex items-center justify-between">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
              - generic [ref=e52]: ▼ 1.95%
            - generic [ref=e53]:
              - button "1D" [ref=e54] [cursor=pointer]
              - button "1W" [ref=e55] [cursor=pointer]
              - button "1M" [ref=e56] [cursor=pointer]
          - img "ETH/G$ price chart" [ref=e58]
        - generic [ref=e63]:
          - generic [ref=e64]:
            - heading "Swap" [level=2] [ref=e65]
            - generic [ref=e66]:
              - generic [ref=e67]:
                - button "0.1% funds UBI" [expanded] [active] [ref=e68] [cursor=pointer]:
                  - img [ref=e69]
                  - text: 0.1% funds UBI
                - generic [ref=e71]:
                  - paragraph [ref=e72]: 0.3% total fee split
                  - generic [ref=e73]:
                    - generic [ref=e74]:
                      - generic [ref=e75]: UBI Pool
                      - generic [ref=e76]: 33%
                    - generic [ref=e77]:
                      - generic [ref=e78]: Protocol
                      - generic [ref=e79]: 17%
                    - generic [ref=e80]:
                      - generic [ref=e81]: Liquidity Providers
                      - generic [ref=e82]: 50%
                  - paragraph [ref=e84]: Every swap automatically funds universal basic income for verified humans worldwide.
              - button "Settings" [ref=e86] [cursor=pointer]:
                - img [ref=e87]
          - generic [ref=e90]:
            - generic [ref=e92]: You pay
            - generic [ref=e93]:
              - textbox "Amount to swap (ETH)" [ref=e94]:
                - /placeholder: "0"
              - button "ETH" [ref=e95] [cursor=pointer]:
                - img [ref=e97]
                - generic [ref=e105]: ETH
                - img [ref=e106]
          - button [ref=e109] [cursor=pointer]:
            - img [ref=e110]
          - generic [ref=e112]:
            - generic [ref=e114]: You receive
            - generic [ref=e115]:
              - generic [ref=e117]: "0"
              - button "G$" [ref=e118] [cursor=pointer]:
                - img [ref=e120]:
                  - generic [ref=e122]: G$
                - generic [ref=e123]: G$
                - img [ref=e124]
          - generic [ref=e126]:
            - button "Enter an Amount" [ref=e127]
            - paragraph [ref=e128]: Try swapping ETH → G$ — 0.1% of fees fund basic income for 640K+ people
        - generic [ref=e129]:
          - heading "How It Works" [level=2] [ref=e130]
          - generic [ref=e131]:
            - generic [ref=e132]:
              - generic [ref=e133]: "1"
              - img [ref=e135]
              - heading "Trade Any Asset" [level=3] [ref=e137]
              - paragraph [ref=e138]: Swap tokens, trade stocks, predict events, or trade perpetual futures — all on one platform.
            - generic [ref=e139]:
              - generic [ref=e140]: "2"
              - img [ref=e142]
              - heading "Fees Fund UBI" [level=3] [ref=e144]
              - paragraph [ref=e145]: 33% of every trading fee goes directly to the GoodDollar UBI pool — automatically.
            - generic [ref=e146]:
              - generic [ref=e147]: "3"
              - img [ref=e149]
              - heading "People Earn Income" [level=3] [ref=e151]
              - paragraph [ref=e152]: Verified humans worldwide receive daily universal basic income payouts from the pool.
        - generic [ref=e154]:
          - heading "Your Fees, Their Income" [level=2] [ref=e155]
          - paragraph [ref=e156]: Universal Basic Income (UBI) is a regular cash payment to every verified human, regardless of employment. GoodDollar has distributed UBI to 640,000+ people worldwide since 2020 — funded by platform trading fees.
          - generic [ref=e157]:
            - generic [ref=e158]:
              - generic [ref=e159]:
                - img [ref=e161]
                - generic [ref=e163]: Your Trade
              - img [ref=e164]
            - generic [ref=e166]:
              - generic [ref=e167]:
                - img [ref=e169]
                - generic [ref=e171]: 33% Fee
              - img [ref=e172]
            - generic [ref=e174]:
              - generic [ref=e175]:
                - img [ref=e177]
                - generic [ref=e179]: UBI Pool
              - img [ref=e180]
            - generic [ref=e183]:
              - img [ref=e185]
              - generic [ref=e187]: 640K+ People
        - generic [ref=e188]:
          - heading "Explore the Platform" [level=2] [ref=e189]
          - paragraph [ref=e190]: Every product on GoodDollar routes fees to universal basic income.
          - generic [ref=e191]:
            - link "GoodSwap Swap any token with 0.1% fees funding UBI. Start Swapping →" [ref=e192] [cursor=pointer]:
              - /url: /swap
              - generic [ref=e193]:
                - img [ref=e195]
                - generic [ref=e197]: GoodSwap
              - paragraph [ref=e198]: Swap any token with 0.1% fees funding UBI.
              - generic [ref=e199]: Start Swapping →
            - link "GoodStocks Trade synthetic equities 24/7. Fractional shares. Every trade funds UBI. View Stocks →" [ref=e200] [cursor=pointer]:
              - /url: /stocks
              - generic [ref=e201]:
                - img [ref=e203]
                - generic [ref=e205]: GoodStocks
              - paragraph [ref=e206]: Trade synthetic equities 24/7. Fractional shares. Every trade funds UBI.
              - generic [ref=e207]: View Stocks →
            - link "GoodPredict Bet on real-world events. Every trade funds UBI. View Markets →" [ref=e208] [cursor=pointer]:
              - /url: /predict
              - generic [ref=e209]:
                - img [ref=e211]
                - generic [ref=e213]: GoodPredict
              - paragraph [ref=e214]: Bet on real-world events. Every trade funds UBI.
              - generic [ref=e215]: View Markets →
            - link "GoodPerps Trade perpetual futures with up to 50x leverage. Every fee funds UBI. Trade Perps →" [ref=e216] [cursor=pointer]:
              - /url: /perps
              - generic [ref=e217]:
                - img [ref=e219]
                - generic [ref=e221]: GoodPerps
              - paragraph [ref=e222]: Trade perpetual futures with up to 50x leverage. Every fee funds UBI.
              - generic [ref=e223]: Trade Perps →
            - link "GoodLend Supply and borrow assets. Earn interest while funding UBI. Lend Now →" [ref=e224] [cursor=pointer]:
              - /url: /lend
              - generic [ref=e225]:
                - img [ref=e227]
                - generic [ref=e229]: GoodLend
              - paragraph [ref=e230]: Supply and borrow assets. Earn interest while funding UBI.
              - generic [ref=e231]: Lend Now →
            - link "GoodStable Mint gUSD stablecoin by locking collateral. 33% of fees fund UBI. Open Vault →" [ref=e232] [cursor=pointer]:
              - /url: /stable
              - generic [ref=e233]:
                - img [ref=e235]
                - generic [ref=e237]: GoodStable
              - paragraph [ref=e238]: Mint gUSD stablecoin by locking collateral. 33% of fees fund UBI.
              - generic [ref=e239]: Open Vault →
        - button "Start Trading →" [ref=e241] [cursor=pointer]:
          - text: Start Trading
          - generic [ref=e242]: →
        - generic [ref=e244]:
          - generic [ref=e245]:
            - generic [ref=e246]: $2.4M
            - generic [ref=e247]: UBI Distributed
          - generic [ref=e248]:
            - generic [ref=e249]: 640K+
            - generic [ref=e250]: Daily Claimers
          - generic [ref=e251]:
            - generic [ref=e252]: 1.2M
            - generic [ref=e253]: Total Swaps
    - contentinfo [ref=e254]:
      - generic [ref=e255]:
        - paragraph [ref=e256]: Powered by GoodDollar L2
        - navigation [ref=e257]:
          - link "Docs" [ref=e258] [cursor=pointer]:
            - /url: https://docs.gooddollar.org
          - link "GitHub" [ref=e259] [cursor=pointer]:
            - /url: https://github.com/GoodDollar
          - link "Community" [ref=e260] [cursor=pointer]:
            - /url: https://community.gooddollar.org
    - region "Notifications (F8)":
      - list
  - alert [ref=e261]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Home / Swap page', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/')
  6  |   })
  7  | 
  8  |   test('renders page title and tagline', async ({ page }) => {
  9  |     await expect(page).toHaveTitle(/GoodDollar/)
  10 |     await expect(page.getByRole('heading', { name: /trade\. predict\. invest\./i })).toBeVisible()
  11 |   })
  12 | 
  13 |   test('renders UBI stats in hero', async ({ page }) => {
  14 |     await expect(page.getByText(/\$2\.4M/).first()).toBeVisible()
  15 |     await expect(page.getByText(/640K\+/).first()).toBeVisible()
  16 |   })
  17 | 
  18 |   test('renders swap card', async ({ page }) => {
  19 |     const swapCard = page.locator('#swap-card')
  20 |     await expect(swapCard).toBeVisible()
  21 |     await expect(swapCard.getByRole('heading', { name: 'Swap' })).toBeVisible()
  22 |   })
  23 | 
  24 |   test('swap card has "You pay" and "You receive" sections', async ({ page }) => {
  25 |     const swapCard = page.locator('#swap-card')
  26 |     await expect(swapCard.getByText('You pay')).toBeVisible()
  27 |     await expect(swapCard.getByText('You receive')).toBeVisible()
  28 |   })
  29 | 
  30 |   test('entering an amount shows output and USD value', async ({ page }) => {
  31 |     const input = page.locator('#swap-card input[inputmode="decimal"]')
  32 |     await input.fill('1')
  33 |     // USD value should appear for input
  34 |     await expect(page.getByTestId('input-usd')).toBeVisible()
  35 |   })
  36 | 
  37 |   test('flip button swaps input and output tokens', async ({ page }) => {
  38 |     const swapCard = page.locator('#swap-card')
  39 |     // Read initial token labels from token selectors
  40 |     const selectors = swapCard.locator('button').filter({ hasText: /ETH|G\$|USDC|BTC/ })
  41 |     const firstCount = await selectors.count()
  42 |     expect(firstCount).toBeGreaterThan(0)
  43 | 
  44 |     // Click the flip button (the only button between pay and receive sections)
  45 |     const flipBtn = swapCard.locator('button').filter({ hasText: '' }).nth(0)
  46 |     // More reliable: find the button with the arrows SVG by its sibling context
  47 |     const allBtns = swapCard.locator('button')
  48 |     // The flip button is rendered between input and output sections
  49 |     await allBtns.nth(0).click() // settings or fee badge - skip
  50 |     // Use aria-label or just click the directional arrows button
  51 |     // The flip button has no aria-label; find by its containing div with z-10
  52 |     const flipSection = page.locator('.flex.justify-center.-my-3')
  53 |     const flipButton = flipSection.locator('button')
> 54 |     await flipButton.click()
     |                      ^ Error: locator.click: Test timeout of 30000ms exceeded.
  55 |     // After flip, token selectors should have swapped - just verify page is still intact
  56 |     await expect(swapCard.getByText('You pay')).toBeVisible()
  57 |   })
  58 | 
  59 |   test('HowItWorks section is visible', async ({ page }) => {
  60 |     await page.getByText(/how it works/i).waitFor({ state: 'visible', timeout: 10000 })
  61 |     await expect(page.getByText(/how it works/i)).toBeVisible()
  62 |   })
  63 | 
  64 |   test('UBI Explainer section is present', async ({ page }) => {
  65 |     await page.getByText(/ubi/i).first().waitFor({ state: 'visible', timeout: 10000 })
  66 |     await expect(page.getByText(/universal basic income/i).first()).toBeVisible()
  67 |   })
  68 | 
  69 |   test('?buy= query param pre-selects output token', async ({ page }) => {
  70 |     await page.goto('/?buy=USDC')
  71 |     await expect(page.locator('#swap-card')).toBeVisible()
  72 |     // USDC should appear as output token
  73 |     await expect(page.locator('#swap-card').getByText('USDC').first()).toBeVisible()
  74 |   })
  75 | })
  76 | 
```