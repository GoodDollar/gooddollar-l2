# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> Header navigation — desktop >> Pool and Bridge show "Soon" badge
- Location: e2e/navigation.spec.ts:26:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="soon-badge"]').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="soon-badge"]').first()

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
              - generic [ref=e68]: ▼ 0.04%
            - generic [ref=e69]:
              - button "1D" [ref=e70] [cursor=pointer]
              - button "1W" [ref=e71] [cursor=pointer]
              - button "1M" [ref=e72] [cursor=pointer]
          - img "ETH/G$ price chart" [ref=e74]
        - generic [ref=e79]:
          - generic [ref=e80]:
            - heading "Swap" [level=2] [ref=e81]
            - generic [ref=e82]:
              - button "0.1% funds UBI" [ref=e84] [cursor=pointer]:
                - img [ref=e85]
                - text: 0.1% funds UBI
              - button "Settings" [ref=e88] [cursor=pointer]:
                - img [ref=e89]
          - generic [ref=e92]:
            - generic [ref=e94]: You pay
            - generic [ref=e95]:
              - textbox "Amount to swap (ETH)" [ref=e96]:
                - /placeholder: "0"
              - button "ETH" [ref=e97] [cursor=pointer]:
                - img [ref=e99]
                - generic [ref=e107]: ETH
                - img [ref=e108]
          - button [ref=e111] [cursor=pointer]:
            - img [ref=e112]
          - generic [ref=e114]:
            - generic [ref=e116]: You receive
            - generic [ref=e117]:
              - generic [ref=e118]: "0"
              - button "G$" [ref=e119] [cursor=pointer]:
                - img [ref=e121]:
                  - generic [ref=e123]: G$
                - generic [ref=e124]: G$
                - img [ref=e125]
          - generic [ref=e127]:
            - button "Enter an Amount" [ref=e128]
            - paragraph [ref=e129]: Try swapping ETH → G$ — 0.1% of fees fund basic income for 640K+ people
        - generic [ref=e130]:
          - heading "How It Works" [level=2] [ref=e131]
          - generic [ref=e132]:
            - generic [ref=e133]:
              - generic [ref=e134]: "1"
              - img [ref=e136]
              - heading "Trade Any Asset" [level=3] [ref=e138]
              - paragraph [ref=e139]: Swap tokens, trade stocks, predict events, or trade perpetual futures — all on one platform.
            - generic [ref=e140]:
              - generic [ref=e141]: "2"
              - img [ref=e143]
              - heading "Fees Fund UBI" [level=3] [ref=e145]
              - paragraph [ref=e146]: 33% of every trading fee goes directly to the GoodDollar UBI pool — automatically.
            - generic [ref=e147]:
              - generic [ref=e148]: "3"
              - img [ref=e150]
              - heading "People Earn Income" [level=3] [ref=e152]
              - paragraph [ref=e153]: Verified humans worldwide receive daily universal basic income payouts from the pool.
        - generic [ref=e155]:
          - heading "Your Fees, Their Income" [level=2] [ref=e156]
          - paragraph [ref=e157]: Universal Basic Income (UBI) is a regular cash payment to every verified human, regardless of employment. GoodDollar has distributed UBI to 640,000+ people worldwide since 2020 — funded by platform trading fees.
          - generic [ref=e158]:
            - generic [ref=e159]:
              - generic [ref=e160]:
                - img [ref=e162]
                - generic [ref=e164]: Your Trade
              - img [ref=e165]
            - generic [ref=e167]:
              - generic [ref=e168]:
                - img [ref=e170]
                - generic [ref=e172]: 33% Fee
              - img [ref=e173]
            - generic [ref=e175]:
              - generic [ref=e176]:
                - img [ref=e178]
                - generic [ref=e180]: UBI Pool
              - img [ref=e181]
            - generic [ref=e184]:
              - img [ref=e186]
              - generic [ref=e188]: 640K+ People
        - generic [ref=e189]:
          - heading "Explore the Platform" [level=2] [ref=e190]
          - paragraph [ref=e191]: Every product on GoodDollar routes fees to universal basic income.
          - generic [ref=e192]:
            - link "GoodSwap Swap any token with 0.1% fees funding UBI. Start Swapping →" [ref=e193] [cursor=pointer]:
              - /url: /swap
              - generic [ref=e194]:
                - img [ref=e196]
                - generic [ref=e198]: GoodSwap
              - paragraph [ref=e199]: Swap any token with 0.1% fees funding UBI.
              - generic [ref=e200]: Start Swapping →
            - link "GoodStocks Trade synthetic equities 24/7. Fractional shares. Every trade funds UBI. View Stocks →" [ref=e201] [cursor=pointer]:
              - /url: /stocks
              - generic [ref=e202]:
                - img [ref=e204]
                - generic [ref=e206]: GoodStocks
              - paragraph [ref=e207]: Trade synthetic equities 24/7. Fractional shares. Every trade funds UBI.
              - generic [ref=e208]: View Stocks →
            - link "GoodPredict Bet on real-world events. Every trade funds UBI. View Markets →" [ref=e209] [cursor=pointer]:
              - /url: /predict
              - generic [ref=e210]:
                - img [ref=e212]
                - generic [ref=e214]: GoodPredict
              - paragraph [ref=e215]: Bet on real-world events. Every trade funds UBI.
              - generic [ref=e216]: View Markets →
            - link "GoodPerps Trade perpetual futures with up to 50x leverage. Every fee funds UBI. Trade Perps →" [ref=e217] [cursor=pointer]:
              - /url: /perps
              - generic [ref=e218]:
                - img [ref=e220]
                - generic [ref=e222]: GoodPerps
              - paragraph [ref=e223]: Trade perpetual futures with up to 50x leverage. Every fee funds UBI.
              - generic [ref=e224]: Trade Perps →
            - link "GoodLend Supply and borrow assets. Earn interest while funding UBI. Lend Now →" [ref=e225] [cursor=pointer]:
              - /url: /lend
              - generic [ref=e226]:
                - img [ref=e228]
                - generic [ref=e230]: GoodLend
              - paragraph [ref=e231]: Supply and borrow assets. Earn interest while funding UBI.
              - generic [ref=e232]: Lend Now →
            - link "GoodStable Mint gUSD stablecoin by locking collateral. 33% of fees fund UBI. Open Vault →" [ref=e233] [cursor=pointer]:
              - /url: /stable
              - generic [ref=e234]:
                - img [ref=e236]
                - generic [ref=e238]: GoodStable
              - paragraph [ref=e239]: Mint gUSD stablecoin by locking collateral. 33% of fees fund UBI.
              - generic [ref=e240]: Open Vault →
        - button "Start Trading →" [ref=e242] [cursor=pointer]:
          - text: Start Trading
          - generic [ref=e243]: →
        - generic [ref=e245]:
          - generic [ref=e246]:
            - generic [ref=e247]: $2.4M
            - generic [ref=e248]: UBI Distributed
          - generic [ref=e249]:
            - generic [ref=e250]: 640K+
            - generic [ref=e251]: Daily Claimers
          - generic [ref=e252]:
            - generic [ref=e253]: 1.2M
            - generic [ref=e254]: Total Swaps
    - contentinfo [ref=e255]:
      - generic [ref=e256]:
        - paragraph [ref=e257]: Powered by GoodDollar L2
        - navigation [ref=e258]:
          - link "Docs" [ref=e259] [cursor=pointer]:
            - /url: https://docs.gooddollar.org
          - link "GitHub" [ref=e260] [cursor=pointer]:
            - /url: https://github.com/GoodDollar
          - link "Community" [ref=e261] [cursor=pointer]:
            - /url: https://community.gooddollar.org
    - region "Notifications (F8)":
      - list
  - alert [ref=e262]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | test.describe('Header navigation — desktop', () => {
  4   |   test.use({ viewport: { width: 1280, height: 720 } })
  5   | 
  6   |   test.beforeEach(async ({ page }) => {
  7   |     await page.goto('/')
  8   |   })
  9   | 
  10  |   test('renders GoodDollar logo and brand name', async ({ page }) => {
  11  |     const header = page.locator('header')
  12  |     await expect(header.getByText('GoodDollar')).toBeVisible()
  13  |     await expect(header.getByText('G$')).toBeVisible()
  14  |   })
  15  | 
  16  |   test('desktop nav has Swap, Explore, Pool, Bridge, Stocks, Predict, Perps, Lend links', async ({ page }) => {
  17  |     const nav = page.locator('nav.hidden.sm\\:flex, header nav').first()
  18  |     await expect(nav.getByRole('link', { name: 'Swap' })).toBeVisible()
  19  |     await expect(nav.getByRole('link', { name: 'Explore' })).toBeVisible()
  20  |     await expect(nav.getByRole('link', { name: /Stocks/ })).toBeVisible()
  21  |     await expect(nav.getByRole('link', { name: /Predict/ })).toBeVisible()
  22  |     await expect(nav.getByRole('link', { name: /Perps/ })).toBeVisible()
  23  |     await expect(nav.getByRole('link', { name: /Lend/ })).toBeVisible()
  24  |   })
  25  | 
  26  |   test('Pool and Bridge show "Soon" badge', async ({ page }) => {
  27  |     const soonBadges = page.locator('[data-testid="soon-badge"]')
> 28  |     await expect(soonBadges.first()).toBeVisible()
      |                                      ^ Error: expect(locator).toBeVisible() failed
  29  |     const count = await soonBadges.count()
  30  |     expect(count).toBeGreaterThanOrEqual(2)
  31  |   })
  32  | 
  33  |   test('clicking Explore navigates to /explore', async ({ page }) => {
  34  |     const nav = page.locator('header nav').first()
  35  |     await nav.getByRole('link', { name: 'Explore' }).click()
  36  |     await expect(page).toHaveURL('/explore')
  37  |     await expect(page.getByRole('heading', { name: /explore tokens/i })).toBeVisible()
  38  |   })
  39  | 
  40  |   test('clicking Stocks navigates to /stocks', async ({ page }) => {
  41  |     await page.locator('header nav').first().getByRole('link', { name: 'Stocks' }).click()
  42  |     await expect(page).toHaveURL('/stocks')
  43  |   })
  44  | 
  45  |   test('clicking Predict navigates to /predict', async ({ page }) => {
  46  |     await page.locator('header nav').first().getByRole('link', { name: 'Predict' }).click()
  47  |     await expect(page).toHaveURL('/predict')
  48  |   })
  49  | 
  50  |   test('clicking Perps navigates to /perps', async ({ page }) => {
  51  |     await page.locator('header nav').first().getByRole('link', { name: 'Perps' }).click()
  52  |     await expect(page).toHaveURL('/perps')
  53  |   })
  54  | 
  55  |   test('clicking Lend navigates to /lend', async ({ page }) => {
  56  |     await page.locator('header nav').first().getByRole('link', { name: 'Lend' }).click()
  57  |     await expect(page).toHaveURL('/lend')
  58  |   })
  59  | 
  60  |   test('portfolio icon link navigates to /portfolio', async ({ page }) => {
  61  |     await page.getByRole('link', { name: /portfolio/i }).click()
  62  |     await expect(page).toHaveURL('/portfolio')
  63  |   })
  64  | 
  65  |   test('clicking Swap nav link navigates to /', async ({ page }) => {
  66  |     await page.goto('/explore')
  67  |     await page.locator('header nav').first().getByRole('link', { name: 'Swap' }).click()
  68  |     await expect(page).toHaveURL('/')
  69  |   })
  70  | })
  71  | 
  72  | test.describe('Header navigation — mobile', () => {
  73  |   test.use({ viewport: { width: 390, height: 844 } })
  74  | 
  75  |   test.beforeEach(async ({ page }) => {
  76  |     await page.goto('/')
  77  |   })
  78  | 
  79  |   test('hamburger button is visible on mobile', async ({ page }) => {
  80  |     const hamburger = page.getByLabel('Open menu')
  81  |     await expect(hamburger).toBeVisible()
  82  |   })
  83  | 
  84  |   test('desktop nav is hidden on mobile', async ({ page }) => {
  85  |     const desktopNav = page.locator('nav.hidden.sm\\:flex')
  86  |     await expect(desktopNav).toBeHidden()
  87  |   })
  88  | 
  89  |   test('tapping hamburger opens mobile menu', async ({ page }) => {
  90  |     await page.getByLabel('Open menu').click()
  91  |     await expect(page.getByTestId('mobile-nav')).toBeVisible()
  92  |   })
  93  | 
  94  |   test('mobile menu contains all nav items', async ({ page }) => {
  95  |     await page.getByLabel('Open menu').click()
  96  |     const mobileNav = page.getByTestId('mobile-nav')
  97  |     await expect(mobileNav.getByText('Swap')).toBeVisible()
  98  |     await expect(mobileNav.getByText('Explore')).toBeVisible()
  99  |     await expect(mobileNav.getByText('Stocks')).toBeVisible()
  100 |     await expect(mobileNav.getByText('Predict')).toBeVisible()
  101 |     await expect(mobileNav.getByText('Perps')).toBeVisible()
  102 |     await expect(mobileNav.getByText('Lend')).toBeVisible()
  103 |   })
  104 | 
  105 |   test('mobile menu shows Coming Soon for Pool and Bridge', async ({ page }) => {
  106 |     await page.getByLabel('Open menu').click()
  107 |     const mobileNav = page.getByTestId('mobile-nav')
  108 |     const comingSoon = mobileNav.getByText('Coming Soon')
  109 |     await expect(comingSoon.first()).toBeVisible()
  110 |     const count = await comingSoon.count()
  111 |     expect(count).toBeGreaterThanOrEqual(2)
  112 |   })
  113 | 
  114 |   test('tapping close button dismisses mobile menu', async ({ page }) => {
  115 |     await page.getByLabel('Open menu').click()
  116 |     await expect(page.getByTestId('mobile-nav')).toBeVisible()
  117 |     await page.getByLabel('Close menu').click()
  118 |     await expect(page.getByTestId('mobile-nav')).not.toBeVisible()
  119 |   })
  120 | 
  121 |   test('pressing Escape dismisses mobile menu', async ({ page }) => {
  122 |     await page.getByLabel('Open menu').click()
  123 |     await expect(page.getByTestId('mobile-nav')).toBeVisible()
  124 |     await page.keyboard.press('Escape')
  125 |     await expect(page.getByTestId('mobile-nav')).not.toBeVisible()
  126 |   })
  127 | 
  128 |   test('tapping a menu item navigates and closes the menu', async ({ page }) => {
```