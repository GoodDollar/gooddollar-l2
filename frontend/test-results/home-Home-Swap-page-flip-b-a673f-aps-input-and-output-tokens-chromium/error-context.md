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
    51 × waiting for element to be visible, enabled and stable
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
        - navigation [ref=e9]:
          - link "Swap" [ref=e10] [cursor=pointer]:
            - /url: /
          - link "Explore" [ref=e11] [cursor=pointer]:
            - /url: /explore
          - link "Pool" [ref=e12] [cursor=pointer]:
            - /url: /pool
          - link "Bridge" [ref=e13] [cursor=pointer]:
            - /url: /bridge
          - link "Stocks" [ref=e14] [cursor=pointer]:
            - /url: /stocks
          - link "Predict" [ref=e15] [cursor=pointer]:
            - /url: /predict
          - link "Perps" [ref=e16] [cursor=pointer]:
            - /url: /perps
          - link "Lend" [ref=e17] [cursor=pointer]:
            - /url: /lend
          - link "Stable" [ref=e18] [cursor=pointer]:
            - /url: /stable
          - link "Yield" [ref=e19] [cursor=pointer]:
            - /url: /yield
          - link "Govern" [ref=e20] [cursor=pointer]:
            - /url: /governance
          - link "Agents" [ref=e21] [cursor=pointer]:
            - /url: /agents
          - link "UBI" [ref=e22] [cursor=pointer]:
            - /url: /ubi-impact
          - link "Activity" [ref=e23] [cursor=pointer]:
            - /url: /activity
            - generic [ref=e24]: Activity
          - link "Tests" [ref=e26] [cursor=pointer]:
            - /url: /test-dashboard
        - generic [ref=e27]:
          - link "Portfolio" [ref=e28] [cursor=pointer]:
            - /url: /portfolio
            - img [ref=e29]
          - button "Switch to light mode" [ref=e31] [cursor=pointer]:
            - img [ref=e32]
          - button "Recent activity" [ref=e39] [cursor=pointer]:
            - img [ref=e40]
          - button "Connect Wallet" [ref=e42] [cursor=pointer]:
            - generic [ref=e43]:
              - img [ref=e44]
              - generic [ref=e46]: Connect Wallet
    - generic [ref=e48]:
      - paragraph [ref=e49]: ♥$2.4M distributed to 640K+ people through UBI — funded by your trades
      - button "Dismiss UBI banner" [ref=e50] [cursor=pointer]:
        - img [ref=e51]
    - main [ref=e53]:
      - generic [ref=e55]:
        - generic [ref=e56]:
          - heading "Trade. Predict. Invest. Fund UBI." [level=1] [ref=e57]
          - paragraph [ref=e58]: Every swap, prediction, and trade on GoodDollar automatically funds universal basic income for verified humans worldwide.
          - paragraph [ref=e59]:
            - generic [ref=e61]: $2.4M
            - text: already distributed to
            - generic [ref=e62]: 640K+
            - text: people worldwide
        - generic [ref=e63]:
          - generic [ref=e64]:
            - generic [ref=e65]:
              - generic [ref=e66]:
                - text: 1 ETH =
                - generic [ref=e67]: 295,338 G$
              - generic [ref=e68]: ▲ 1.89%
            - generic [ref=e69]:
              - button "1D" [ref=e70] [cursor=pointer]
              - button "1W" [ref=e71] [cursor=pointer]
              - button "1M" [ref=e72] [cursor=pointer]
          - img "ETH/G$ price chart" [ref=e74]
        - generic [ref=e79]:
          - generic [ref=e80]:
            - heading "Swap" [level=2] [ref=e81]
            - generic [ref=e82]:
              - generic [ref=e83]:
                - button "0.1% funds UBI" [expanded] [active] [ref=e84] [cursor=pointer]:
                  - img [ref=e85]
                  - text: 0.1% funds UBI
                - generic [ref=e87]:
                  - paragraph [ref=e88]: 0.3% total fee split
                  - generic [ref=e89]:
                    - generic [ref=e90]:
                      - generic [ref=e91]: UBI Pool
                      - generic [ref=e92]: 33%
                    - generic [ref=e93]:
                      - generic [ref=e94]: Protocol
                      - generic [ref=e95]: 17%
                    - generic [ref=e96]:
                      - generic [ref=e97]: Liquidity Providers
                      - generic [ref=e98]: 50%
                  - paragraph [ref=e100]: Every swap automatically funds universal basic income for verified humans worldwide.
              - button "Settings" [ref=e102] [cursor=pointer]:
                - img [ref=e103]
          - generic [ref=e106]:
            - generic [ref=e108]: You pay
            - generic [ref=e109]:
              - textbox "Amount to swap (ETH)" [ref=e110]:
                - /placeholder: "0"
              - button "ETH" [ref=e111] [cursor=pointer]:
                - img [ref=e113]
                - generic [ref=e121]: ETH
                - img [ref=e122]
          - button [ref=e125] [cursor=pointer]:
            - img [ref=e126]
          - generic [ref=e128]:
            - generic [ref=e130]: You receive
            - generic [ref=e131]:
              - generic [ref=e132]: "0"
              - button "G$" [ref=e133] [cursor=pointer]:
                - img [ref=e135]:
                  - generic [ref=e137]: G$
                - generic [ref=e138]: G$
                - img [ref=e139]
          - generic [ref=e141]:
            - button "Enter an Amount" [ref=e142]
            - paragraph [ref=e143]: Try swapping ETH → G$ — 0.1% of fees fund basic income for 640K+ people
        - generic [ref=e144]:
          - heading "How It Works" [level=2] [ref=e145]
          - generic [ref=e146]:
            - generic [ref=e147]:
              - generic [ref=e148]: "1"
              - img [ref=e150]
              - heading "Trade Any Asset" [level=3] [ref=e152]
              - paragraph [ref=e153]: Swap tokens, trade stocks, predict events, or trade perpetual futures — all on one platform.
            - generic [ref=e154]:
              - generic [ref=e155]: "2"
              - img [ref=e157]
              - heading "Fees Fund UBI" [level=3] [ref=e159]
              - paragraph [ref=e160]: 20% of every trading fee goes directly to the GoodDollar UBI pool — automatically.
            - generic [ref=e161]:
              - generic [ref=e162]: "3"
              - img [ref=e164]
              - heading "People Earn Income" [level=3] [ref=e166]
              - paragraph [ref=e167]: Verified humans worldwide receive daily universal basic income payouts from the pool.
        - generic [ref=e169]:
          - heading "Your Fees, Their Income" [level=2] [ref=e170]
          - paragraph [ref=e171]: Universal Basic Income (UBI) is a regular cash payment to every verified human, regardless of employment. GoodDollar has distributed UBI to 640,000+ people worldwide since 2020 — funded by platform trading fees.
          - generic [ref=e172]:
            - generic [ref=e173]:
              - generic [ref=e174]:
                - img [ref=e176]
                - generic [ref=e178]: Your Trade
              - img [ref=e179]
            - generic [ref=e181]:
              - generic [ref=e182]:
                - img [ref=e184]
                - generic [ref=e186]: 20% Fee
              - img [ref=e187]
            - generic [ref=e189]:
              - generic [ref=e190]:
                - img [ref=e192]
                - generic [ref=e194]: UBI Pool
              - img [ref=e195]
            - generic [ref=e198]:
              - img [ref=e200]
              - generic [ref=e202]: 640K+ People
        - generic [ref=e203]:
          - heading "Explore the Platform" [level=2] [ref=e204]
          - paragraph [ref=e205]: Every product on GoodDollar routes fees to universal basic income.
          - generic [ref=e206]:
            - link "GoodSwap Swap any token with 0.1% fees funding UBI. Start Swapping →" [ref=e207] [cursor=pointer]:
              - /url: /swap
              - generic [ref=e208]:
                - img [ref=e210]
                - generic [ref=e212]: GoodSwap
              - paragraph [ref=e213]: Swap any token with 0.1% fees funding UBI.
              - generic [ref=e214]: Start Swapping →
            - link "GoodStocks Trade synthetic equities 24/7. Fractional shares. Every trade funds UBI. View Stocks →" [ref=e215] [cursor=pointer]:
              - /url: /stocks
              - generic [ref=e216]:
                - img [ref=e218]
                - generic [ref=e220]: GoodStocks
              - paragraph [ref=e221]: Trade synthetic equities 24/7. Fractional shares. Every trade funds UBI.
              - generic [ref=e222]: View Stocks →
            - link "GoodPredict Bet on real-world events. Every trade funds UBI. View Markets →" [ref=e223] [cursor=pointer]:
              - /url: /predict
              - generic [ref=e224]:
                - img [ref=e226]
                - generic [ref=e228]: GoodPredict
              - paragraph [ref=e229]: Bet on real-world events. Every trade funds UBI.
              - generic [ref=e230]: View Markets →
            - link "GoodPerps Trade perpetual futures with up to 50x leverage. Every fee funds UBI. Trade Perps →" [ref=e231] [cursor=pointer]:
              - /url: /perps
              - generic [ref=e232]:
                - img [ref=e234]
                - generic [ref=e236]: GoodPerps
              - paragraph [ref=e237]: Trade perpetual futures with up to 50x leverage. Every fee funds UBI.
              - generic [ref=e238]: Trade Perps →
            - link "GoodLend Supply and borrow assets. Earn interest while funding UBI. Lend Now →" [ref=e239] [cursor=pointer]:
              - /url: /lend
              - generic [ref=e240]:
                - img [ref=e242]
                - generic [ref=e244]: GoodLend
              - paragraph [ref=e245]: Supply and borrow assets. Earn interest while funding UBI.
              - generic [ref=e246]: Lend Now →
            - link "GoodStable Mint gUSD stablecoin by locking collateral. 20% of fees fund UBI. Open Vault →" [ref=e247] [cursor=pointer]:
              - /url: /stable
              - generic [ref=e248]:
                - img [ref=e250]
                - generic [ref=e252]: GoodStable
              - paragraph [ref=e253]: Mint gUSD stablecoin by locking collateral. 20% of fees fund UBI.
              - generic [ref=e254]: Open Vault →
        - button "Start Trading →" [ref=e256] [cursor=pointer]:
          - text: Start Trading
          - generic [ref=e257]: →
        - generic [ref=e259]:
          - generic [ref=e260]:
            - generic [ref=e261]: $2.4M
            - generic [ref=e262]: UBI Distributed
          - generic [ref=e263]:
            - generic [ref=e264]: 640K+
            - generic [ref=e265]: Daily Claimers
          - generic [ref=e266]:
            - generic [ref=e267]: 1.2M
            - generic [ref=e268]: Total Swaps
    - contentinfo [ref=e269]:
      - generic [ref=e270]:
        - paragraph [ref=e271]: Powered by GoodDollar L2
        - navigation [ref=e272]:
          - link "Docs" [ref=e273] [cursor=pointer]:
            - /url: https://docs.gooddollar.org
          - link "GitHub" [ref=e274] [cursor=pointer]:
            - /url: https://github.com/GoodDollar
          - link "Community" [ref=e275] [cursor=pointer]:
            - /url: https://community.gooddollar.org
    - region "Notifications (F8)":
      - list
  - alert [ref=e276]
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