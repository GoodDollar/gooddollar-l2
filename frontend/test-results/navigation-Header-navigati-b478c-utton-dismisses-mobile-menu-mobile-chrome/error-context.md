# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> Header navigation — mobile >> tapping close button dismisses mobile menu
- Location: e2e/navigation.spec.ts:114:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel('Close menu')
    - locator resolved to <button aria-label="Close menu" class="sm:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-50 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div aria-hidden="true" class="fixed inset-0 z-40 bg-black/50 sm:hidden"></div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div aria-hidden="true" class="fixed inset-0 z-40 bg-black/50 sm:hidden"></div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    54 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div aria-hidden="true" class="fixed inset-0 z-40 bg-black/50 sm:hidden"></div> intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable

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
          - button "Close menu" [active] [ref=e24] [cursor=pointer]:
            - img [ref=e25]
          - button [ref=e27] [cursor=pointer]:
            - img [ref=e29]
      - navigation [ref=e33]:
        - link "Swap" [ref=e34] [cursor=pointer]:
          - /url: /
        - link "Explore" [ref=e35] [cursor=pointer]:
          - /url: /explore
        - link "Pool" [ref=e36] [cursor=pointer]:
          - /url: /pool
        - link "Bridge" [ref=e37] [cursor=pointer]:
          - /url: /bridge
        - link "Stocks" [ref=e38] [cursor=pointer]:
          - /url: /stocks
        - link "Predict" [ref=e39] [cursor=pointer]:
          - /url: /predict
        - link "Perps" [ref=e40] [cursor=pointer]:
          - /url: /perps
        - link "Lend" [ref=e41] [cursor=pointer]:
          - /url: /lend
        - link "Stable" [ref=e42] [cursor=pointer]:
          - /url: /stable
        - link "Yield" [ref=e43] [cursor=pointer]:
          - /url: /yield
        - link "Govern" [ref=e44] [cursor=pointer]:
          - /url: /governance
        - link "🤖 Agents" [ref=e45] [cursor=pointer]:
          - /url: /agents
        - link "🌍 UBI Impact" [ref=e46] [cursor=pointer]:
          - /url: /ubi-impact
        - link "Activity" [ref=e47] [cursor=pointer]:
          - /url: /activity
          - generic [ref=e48]: Activity
        - link "Tests" [ref=e50] [cursor=pointer]:
          - /url: /test-dashboard
        - link "Portfolio" [ref=e52] [cursor=pointer]:
          - /url: /portfolio
    - generic [ref=e54]:
      - paragraph [ref=e55]: ♥$2.4M distributed to 640K+ people through UBI — funded by your trades
      - button "Dismiss UBI banner" [ref=e56] [cursor=pointer]:
        - img [ref=e57]
    - main [ref=e59]:
      - generic [ref=e61]:
        - generic [ref=e62]:
          - heading "Trade. Predict. Invest. Fund UBI." [level=1] [ref=e63]
          - paragraph [ref=e64]: Every swap, prediction, and trade on GoodDollar automatically funds universal basic income for verified humans worldwide.
          - paragraph [ref=e65]:
            - generic [ref=e67]: $2.4M
            - text: already distributed to
            - generic [ref=e68]: 640K+
            - text: people worldwide
        - generic [ref=e69]:
          - generic [ref=e70]:
            - generic [ref=e71]:
              - generic [ref=e72]:
                - text: 1 ETH =
                - generic [ref=e73]: 295,338 G$
              - generic [ref=e74]: ▼ 3.96%
            - generic [ref=e75]:
              - button "1D" [ref=e76] [cursor=pointer]
              - button "1W" [ref=e77] [cursor=pointer]
              - button "1M" [ref=e78] [cursor=pointer]
          - img "ETH/G$ price chart" [ref=e80]
        - generic [ref=e85]:
          - generic [ref=e86]:
            - heading "Swap" [level=2] [ref=e87]
            - generic [ref=e88]:
              - button "0.1% funds UBI" [ref=e90] [cursor=pointer]:
                - img [ref=e91]
                - text: 0.1% funds UBI
              - button "Settings" [ref=e94] [cursor=pointer]:
                - img [ref=e95]
          - generic [ref=e98]:
            - generic [ref=e100]: You pay
            - generic [ref=e101]:
              - textbox "Amount to swap (ETH)" [ref=e102]:
                - /placeholder: "0"
              - button "ETH" [ref=e103] [cursor=pointer]:
                - img [ref=e105]
                - generic [ref=e113]: ETH
                - img [ref=e114]
          - button [ref=e117] [cursor=pointer]:
            - img [ref=e118]
          - generic [ref=e120]:
            - generic [ref=e122]: You receive
            - generic [ref=e123]:
              - generic [ref=e125]: "0"
              - button "G$" [ref=e126] [cursor=pointer]:
                - img [ref=e128]:
                  - generic [ref=e130]: G$
                - generic [ref=e131]: G$
                - img [ref=e132]
          - generic [ref=e134]:
            - button "Enter an Amount" [ref=e135]
            - paragraph [ref=e136]: Try swapping ETH → G$ — 0.1% of fees fund basic income for 640K+ people
        - generic [ref=e137]:
          - heading "How It Works" [level=2] [ref=e138]
          - generic [ref=e139]:
            - generic [ref=e140]:
              - generic [ref=e141]: "1"
              - img [ref=e143]
              - heading "Trade Any Asset" [level=3] [ref=e145]
              - paragraph [ref=e146]: Swap tokens, trade stocks, predict events, or trade perpetual futures — all on one platform.
            - generic [ref=e147]:
              - generic [ref=e148]: "2"
              - img [ref=e150]
              - heading "Fees Fund UBI" [level=3] [ref=e152]
              - paragraph [ref=e153]: 20% of every trading fee goes directly to the GoodDollar UBI pool — automatically.
            - generic [ref=e154]:
              - generic [ref=e155]: "3"
              - img [ref=e157]
              - heading "People Earn Income" [level=3] [ref=e159]
              - paragraph [ref=e160]: Verified humans worldwide receive daily universal basic income payouts from the pool.
        - generic [ref=e162]:
          - heading "Your Fees, Their Income" [level=2] [ref=e163]
          - paragraph [ref=e164]: Universal Basic Income (UBI) is a regular cash payment to every verified human, regardless of employment. GoodDollar has distributed UBI to 640,000+ people worldwide since 2020 — funded by platform trading fees.
          - generic [ref=e165]:
            - generic [ref=e166]:
              - generic [ref=e167]:
                - img [ref=e169]
                - generic [ref=e171]: Your Trade
              - img [ref=e172]
            - generic [ref=e174]:
              - generic [ref=e175]:
                - img [ref=e177]
                - generic [ref=e179]: 20% Fee
              - img [ref=e180]
            - generic [ref=e182]:
              - generic [ref=e183]:
                - img [ref=e185]
                - generic [ref=e187]: UBI Pool
              - img [ref=e188]
            - generic [ref=e191]:
              - img [ref=e193]
              - generic [ref=e195]: 640K+ People
        - generic [ref=e196]:
          - heading "Explore the Platform" [level=2] [ref=e197]
          - paragraph [ref=e198]: Every product on GoodDollar routes fees to universal basic income.
          - generic [ref=e199]:
            - link "GoodSwap Swap any token with 0.1% fees funding UBI. Start Swapping →" [ref=e200] [cursor=pointer]:
              - /url: /swap
              - generic [ref=e201]:
                - img [ref=e203]
                - generic [ref=e205]: GoodSwap
              - paragraph [ref=e206]: Swap any token with 0.1% fees funding UBI.
              - generic [ref=e207]: Start Swapping →
            - link "GoodStocks Trade synthetic equities 24/7. Fractional shares. Every trade funds UBI. View Stocks →" [ref=e208] [cursor=pointer]:
              - /url: /stocks
              - generic [ref=e209]:
                - img [ref=e211]
                - generic [ref=e213]: GoodStocks
              - paragraph [ref=e214]: Trade synthetic equities 24/7. Fractional shares. Every trade funds UBI.
              - generic [ref=e215]: View Stocks →
            - link "GoodPredict Bet on real-world events. Every trade funds UBI. View Markets →" [ref=e216] [cursor=pointer]:
              - /url: /predict
              - generic [ref=e217]:
                - img [ref=e219]
                - generic [ref=e221]: GoodPredict
              - paragraph [ref=e222]: Bet on real-world events. Every trade funds UBI.
              - generic [ref=e223]: View Markets →
            - link "GoodPerps Trade perpetual futures with up to 50x leverage. Every fee funds UBI. Trade Perps →" [ref=e224] [cursor=pointer]:
              - /url: /perps
              - generic [ref=e225]:
                - img [ref=e227]
                - generic [ref=e229]: GoodPerps
              - paragraph [ref=e230]: Trade perpetual futures with up to 50x leverage. Every fee funds UBI.
              - generic [ref=e231]: Trade Perps →
            - link "GoodLend Supply and borrow assets. Earn interest while funding UBI. Lend Now →" [ref=e232] [cursor=pointer]:
              - /url: /lend
              - generic [ref=e233]:
                - img [ref=e235]
                - generic [ref=e237]: GoodLend
              - paragraph [ref=e238]: Supply and borrow assets. Earn interest while funding UBI.
              - generic [ref=e239]: Lend Now →
            - link "GoodStable Mint gUSD stablecoin by locking collateral. 20% of fees fund UBI. Open Vault →" [ref=e240] [cursor=pointer]:
              - /url: /stable
              - generic [ref=e241]:
                - img [ref=e243]
                - generic [ref=e245]: GoodStable
              - paragraph [ref=e246]: Mint gUSD stablecoin by locking collateral. 20% of fees fund UBI.
              - generic [ref=e247]: Open Vault →
        - button "Start Trading →" [ref=e249] [cursor=pointer]:
          - text: Start Trading
          - generic [ref=e250]: →
        - generic [ref=e252]:
          - generic [ref=e253]:
            - generic [ref=e254]: $2.4M
            - generic [ref=e255]: UBI Distributed
          - generic [ref=e256]:
            - generic [ref=e257]: 640K+
            - generic [ref=e258]: Daily Claimers
          - generic [ref=e259]:
            - generic [ref=e260]: 1.2M
            - generic [ref=e261]: Total Swaps
    - contentinfo [ref=e262]:
      - generic [ref=e263]:
        - paragraph [ref=e264]: Powered by GoodDollar L2
        - navigation [ref=e265]:
          - link "Docs" [ref=e266] [cursor=pointer]:
            - /url: https://docs.gooddollar.org
          - link "GitHub" [ref=e267] [cursor=pointer]:
            - /url: https://github.com/GoodDollar
          - link "Community" [ref=e268] [cursor=pointer]:
            - /url: https://community.gooddollar.org
    - region "Notifications (F8)":
      - list
  - alert [ref=e269]
```

# Test source

```ts
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
  28  |     await expect(soonBadges.first()).toBeVisible()
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
> 117 |     await page.getByLabel('Close menu').click()
      |                                         ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  129 |     await page.getByLabel('Open menu').click()
  130 |     await page.getByTestId('mobile-nav').getByText('Explore').click()
  131 |     await expect(page).toHaveURL('/explore')
  132 |     await expect(page.getByTestId('mobile-nav')).not.toBeVisible()
  133 |   })
  134 | })
  135 | 
```