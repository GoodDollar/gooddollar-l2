# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: explore.spec.ts >> Explore page >> clicking Swap button on row navigates home with buy param
- Location: e2e/explore.spec.ts:61:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('table tbody tr').first().getByRole('button', { name: 'Swap' })

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
          - heading "Explore Tokens" [level=1] [ref=e41]
          - paragraph [ref=e42]: Browse token prices, volume, and market data on GoodDollar L2
        - generic [ref=e43]:
          - generic [ref=e46]:
            - generic [ref=e47]: Total Market Cap
            - generic [ref=e48]: $0
            - generic [ref=e49]: ▲ 0.00% (24h)
          - generic [ref=e50]:
            - generic [ref=e51]:
              - img [ref=e52]
              - text: Trending
            - generic [ref=e54]:
              - generic [ref=e55]:
                - generic [ref=e56]:
                  - generic [ref=e57]: "1"
                  - img [ref=e59]:
                    - generic [ref=e61]: G$
                  - generic [ref=e62]: G$
                - generic [ref=e63]:
                  - generic [ref=e64]: $0.0102
                  - generic [ref=e65]: ▲0.0%
              - generic [ref=e66]:
                - generic [ref=e67]:
                  - generic [ref=e68]: "2"
                  - img [ref=e70]
                  - generic [ref=e78]: ETH
                - generic [ref=e79]:
                  - generic [ref=e80]: $3,012.45
                  - generic [ref=e81]: ▲0.0%
              - generic [ref=e82]:
                - generic [ref=e83]:
                  - generic [ref=e84]: "3"
                  - img [ref=e86]
                  - generic [ref=e90]: USDC
                - generic [ref=e91]:
                  - generic [ref=e92]: $1.00
                  - generic [ref=e93]: ▲0.0%
          - generic [ref=e94]:
            - generic [ref=e95]:
              - img [ref=e96]
              - text: Top Gainers
            - generic [ref=e98]:
              - generic [ref=e99]:
                - generic [ref=e100]: "1"
                - text: No more gainers today
              - generic [ref=e101]:
                - generic [ref=e102]: "2"
                - text: No more gainers today
              - generic [ref=e103]:
                - generic [ref=e104]: "3"
                - text: No more gainers today
        - textbox "Search tokens..." [ref=e106]
        - generic [ref=e107]:
          - button "All" [ref=e108] [cursor=pointer]
          - button "DeFi" [ref=e109] [cursor=pointer]
          - button "Stablecoins" [ref=e110] [cursor=pointer]
          - button "Layer 2" [ref=e111] [cursor=pointer]
          - button "Infrastructure" [ref=e112] [cursor=pointer]
          - button "GoodDollar" [ref=e113] [cursor=pointer]
        - table [ref=e116]:
          - rowgroup [ref=e117]:
            - row "# Token Price ↕ 24h ↕" [ref=e118]:
              - columnheader "#" [ref=e119]
              - columnheader "Token" [ref=e120]
              - columnheader "Price ↕" [ref=e121] [cursor=pointer]
              - columnheader "24h ↕" [ref=e122] [cursor=pointer]
          - rowgroup [ref=e123]:
            - row "1 G$ $0.0102 ▲0.00%" [ref=e124] [cursor=pointer]:
              - cell "1" [ref=e125]
              - cell "G$" [ref=e126]:
                - generic [ref=e127]:
                  - img [ref=e129]:
                    - generic [ref=e131]: G$
                  - generic [ref=e132]: G$
              - cell "$0.0102" [ref=e133]
              - cell "▲0.00%" [ref=e134]:
                - generic [ref=e135]: ▲0.00%
            - row "2 ETH $3,012.45 ▲0.00%" [ref=e136] [cursor=pointer]:
              - cell "2" [ref=e137]
              - cell "ETH" [ref=e138]:
                - generic [ref=e139]:
                  - img [ref=e141]
                  - generic [ref=e149]: ETH
              - cell "$3,012.45" [ref=e150]
              - cell "▲0.00%" [ref=e151]:
                - generic [ref=e152]: ▲0.00%
            - row "3 USDC $1.00 ▲0.00%" [ref=e153] [cursor=pointer]:
              - cell "3" [ref=e154]
              - cell "USDC" [ref=e155]:
                - generic [ref=e156]:
                  - img [ref=e158]
                  - generic [ref=e162]: USDC
              - cell "$1.00" [ref=e163]
              - cell "▲0.00%" [ref=e164]:
                - generic [ref=e165]: ▲0.00%
            - row "4 WBTC $60,125.8 ▲0.00%" [ref=e166] [cursor=pointer]:
              - cell "4" [ref=e167]
              - cell "WBTC" [ref=e168]:
                - generic [ref=e169]:
                  - img [ref=e171]
                  - generic [ref=e174]: WBTC
              - cell "$60,125.8" [ref=e175]
              - cell "▲0.00%" [ref=e176]:
                - generic [ref=e177]: ▲0.00%
            - row "5 DAI $1.00 ▲0.00%" [ref=e178] [cursor=pointer]:
              - cell "5" [ref=e179]
              - cell "DAI" [ref=e180]:
                - generic [ref=e181]:
                  - img [ref=e183]
                  - generic [ref=e187]: DAI
              - cell "$1.00" [ref=e188]
              - cell "▲0.00%" [ref=e189]:
                - generic [ref=e190]: ▲0.00%
            - row "6 USDT $1.00 ▲0.00%" [ref=e191] [cursor=pointer]:
              - cell "6" [ref=e192]
              - cell "USDT" [ref=e193]:
                - generic [ref=e194]:
                  - img [ref=e196]
                  - generic [ref=e200]: USDT
              - cell "$1.00" [ref=e201]
              - cell "▲0.00%" [ref=e202]:
                - generic [ref=e203]: ▲0.00%
            - row "7 LINK $14.85 ▲0.00%" [ref=e204] [cursor=pointer]:
              - cell "7" [ref=e205]
              - cell "LINK" [ref=e206]:
                - generic [ref=e207]:
                  - img [ref=e209]
                  - generic [ref=e212]: LINK
              - cell "$14.85" [ref=e213]
              - cell "▲0.00%" [ref=e214]:
                - generic [ref=e215]: ▲0.00%
            - row "8 UNI $7.92 ▲0.00%" [ref=e216] [cursor=pointer]:
              - cell "8" [ref=e217]
              - cell "UNI" [ref=e218]:
                - generic [ref=e219]:
                  - img [ref=e221]:
                    - generic [ref=e223]: UNI
                  - generic [ref=e224]: UNI
              - cell "$7.92" [ref=e225]
              - cell "▲0.00%" [ref=e226]:
                - generic [ref=e227]: ▲0.00%
            - row "9 AAVE $89.50 ▲0.00%" [ref=e228] [cursor=pointer]:
              - cell "9" [ref=e229]
              - cell "AAVE" [ref=e230]:
                - generic [ref=e231]:
                  - img [ref=e233]:
                    - generic [ref=e235]: AAVE
                  - generic [ref=e236]: AAVE
              - cell "$89.50" [ref=e237]
              - cell "▲0.00%" [ref=e238]:
                - generic [ref=e239]: ▲0.00%
            - row "10 ARB $1.18 ▲0.00%" [ref=e240] [cursor=pointer]:
              - cell "10" [ref=e241]
              - cell "ARB" [ref=e242]:
                - generic [ref=e243]:
                  - img [ref=e245]:
                    - generic [ref=e247]: ARB
                  - generic [ref=e248]: ARB
              - cell "$1.18" [ref=e249]
              - cell "▲0.00%" [ref=e250]:
                - generic [ref=e251]: ▲0.00%
            - row "11 OP $2.45 ▲0.00%" [ref=e252] [cursor=pointer]:
              - cell "11" [ref=e253]
              - cell "OP" [ref=e254]:
                - generic [ref=e255]:
                  - img [ref=e257]:
                    - generic [ref=e259]: OP
                  - generic [ref=e260]: OP
              - cell "$2.45" [ref=e261]
              - cell "▲0.00%" [ref=e262]:
                - generic [ref=e263]: ▲0.00%
            - row "12 MKR $2,814 ▲0.00%" [ref=e264] [cursor=pointer]:
              - cell "12" [ref=e265]
              - cell "MKR" [ref=e266]:
                - generic [ref=e267]:
                  - img [ref=e269]:
                    - generic [ref=e271]: MKR
                  - generic [ref=e272]: MKR
              - cell "$2,814" [ref=e273]
              - cell "▲0.00%" [ref=e274]:
                - generic [ref=e275]: ▲0.00%
            - row "13 COMP $49.80 ▲0.00%" [ref=e276] [cursor=pointer]:
              - cell "13" [ref=e277]
              - cell "COMP" [ref=e278]:
                - generic [ref=e279]:
                  - img [ref=e281]:
                    - generic [ref=e283]: COMP
                  - generic [ref=e284]: COMP
              - cell "$49.80" [ref=e285]
              - cell "▲0.00%" [ref=e286]:
                - generic [ref=e287]: ▲0.00%
            - row "14 SNX $2.95 ▲0.00%" [ref=e288] [cursor=pointer]:
              - cell "14" [ref=e289]
              - cell "SNX" [ref=e290]:
                - generic [ref=e291]:
                  - img [ref=e293]:
                    - generic [ref=e295]: SNX
                  - generic [ref=e296]: SNX
              - cell "$2.95" [ref=e297]
              - cell "▲0.00%" [ref=e298]:
                - generic [ref=e299]: ▲0.00%
            - row "15 CRV $0.5800 ▲0.00%" [ref=e300] [cursor=pointer]:
              - cell "15" [ref=e301]
              - cell "CRV" [ref=e302]:
                - generic [ref=e303]:
                  - img [ref=e305]:
                    - generic [ref=e307]: CRV
                  - generic [ref=e308]: CRV
              - cell "$0.5800" [ref=e309]
              - cell "▲0.00%" [ref=e310]:
                - generic [ref=e311]: ▲0.00%
            - row "16 LDO $2.18 ▲0.00%" [ref=e312] [cursor=pointer]:
              - cell "16" [ref=e313]
              - cell "LDO" [ref=e314]:
                - generic [ref=e315]:
                  - img [ref=e317]:
                    - generic [ref=e319]: LDO
                  - generic [ref=e320]: LDO
              - cell "$2.18" [ref=e321]
              - cell "▲0.00%" [ref=e322]:
                - generic [ref=e323]: ▲0.00%
            - row "17 MATIC $0.7100 ▲0.00%" [ref=e324] [cursor=pointer]:
              - cell "17" [ref=e325]
              - cell "MATIC" [ref=e326]:
                - generic [ref=e327]:
                  - img [ref=e329]:
                    - generic [ref=e331]: MAT
                  - generic [ref=e332]: MATIC
              - cell "$0.7100" [ref=e333]
              - cell "▲0.00%" [ref=e334]:
                - generic [ref=e335]: ▲0.00%
            - row "18 WETH $3,012.45 ▲0.00%" [ref=e336] [cursor=pointer]:
              - cell "18" [ref=e337]
              - cell "WETH" [ref=e338]:
                - generic [ref=e339]:
                  - img [ref=e341]
                  - generic [ref=e349]: WETH
              - cell "$3,012.45" [ref=e350]
              - cell "▲0.00%" [ref=e351]:
                - generic [ref=e352]: ▲0.00%
        - paragraph [ref=e353]: Prices shown are illustrative. Real-time data coming soon.
    - contentinfo [ref=e354]:
      - generic [ref=e355]:
        - paragraph [ref=e356]: Powered by GoodDollar L2
        - navigation [ref=e357]:
          - link "Docs" [ref=e358] [cursor=pointer]:
            - /url: https://docs.gooddollar.org
          - link "GitHub" [ref=e359] [cursor=pointer]:
            - /url: https://github.com/GoodDollar
          - link "Community" [ref=e360] [cursor=pointer]:
            - /url: https://community.gooddollar.org
    - region "Notifications (F8)":
      - list
  - alert [ref=e361]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Explore page', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/explore')
  6  |   })
  7  | 
  8  |   test('renders page heading', async ({ page }) => {
  9  |     await expect(page.getByRole('heading', { name: /explore tokens/i })).toBeVisible()
  10 |   })
  11 | 
  12 |   test('renders market stats bar with three cards', async ({ page }) => {
  13 |     await expect(page.getByText(/total market cap/i)).toBeVisible()
  14 |     await expect(page.getByText(/trending/i)).toBeVisible()
  15 |     await expect(page.getByText(/top gainers/i)).toBeVisible()
  16 |   })
  17 | 
  18 |   test('token table is visible with header columns', async ({ page }) => {
  19 |     const table = page.locator('table')
  20 |     await expect(table).toBeVisible()
  21 |     await expect(table.getByRole('columnheader', { name: /token/i })).toBeVisible()
  22 |     await expect(table.getByRole('columnheader', { name: /price/i })).toBeVisible()
  23 |     await expect(table.getByRole('columnheader', { name: /24h/i })).toBeVisible()
  24 |   })
  25 | 
  26 |   test('token rows are present', async ({ page }) => {
  27 |     const rows = page.locator('table tbody tr')
  28 |     const count = await rows.count()
  29 |     expect(count).toBeGreaterThan(0)
  30 |   })
  31 | 
  32 |   test('search filters token list', async ({ page }) => {
  33 |     const searchInput = page.getByPlaceholder(/search tokens/i)
  34 |     await searchInput.fill('ETH')
  35 |     const rows = page.locator('table tbody tr')
  36 |     // After filtering, should show fewer rows or only ETH-related
  37 |     await page.waitForTimeout(300)
  38 |     const count = await rows.count()
  39 |     expect(count).toBeGreaterThan(0)
  40 |     // No empty-state for ETH search
  41 |     await expect(page.getByText(/no tokens match/i)).not.toBeVisible()
  42 |   })
  43 | 
  44 |   test('search with non-existent token shows empty state', async ({ page }) => {
  45 |     const searchInput = page.getByPlaceholder(/search tokens/i)
  46 |     await searchInput.fill('DOESNOTEXIST12345')
  47 |     await expect(page.getByText(/no tokens match your search/i)).toBeVisible()
  48 |   })
  49 | 
  50 |   test('category filter buttons are present', async ({ page }) => {
  51 |     const allButton = page.getByRole('button', { name: 'All', exact: true })
  52 |     await expect(allButton).toBeVisible()
  53 |   })
  54 | 
  55 |   test('clicking a token row navigates to explore/[symbol]', async ({ page }) => {
  56 |     const firstRow = page.locator('table tbody tr').first()
  57 |     await firstRow.click()
  58 |     await expect(page).toHaveURL(/\/explore\/[A-Z$]+/)
  59 |   })
  60 | 
  61 |   test('clicking Swap button on row navigates home with buy param', async ({ page }) => {
  62 |     const firstRow = page.locator('table tbody tr').first()
  63 |     await firstRow.hover()
  64 |     const swapBtn = firstRow.getByRole('button', { name: 'Swap' })
> 65 |     await swapBtn.click()
     |                   ^ Error: locator.click: Test timeout of 30000ms exceeded.
  66 |     await expect(page).toHaveURL(/\/\?buy=/)
  67 |   })
  68 | 
  69 |   test('clicking a column header sorts the table', async ({ page }) => {
  70 |     const priceHeader = page.getByRole('columnheader', { name: /price/i })
  71 |     await priceHeader.click()
  72 |     // Sort arrow should change — just verify page still has rows
  73 |     const rows = page.locator('table tbody tr')
  74 |     const count = await rows.count()
  75 |     expect(count).toBeGreaterThan(0)
  76 |   })
  77 | })
  78 | 
  79 | test.describe('Explore token detail page', () => {
  80 |   test('navigating to /explore/ETH renders detail page', async ({ page }) => {
  81 |     await page.goto('/explore/ETH')
  82 |     // Should render without crashing
  83 |     await expect(page).not.toHaveURL(/\/404/)
  84 |     await expect(page.locator('body')).toBeVisible()
  85 |   })
  86 | })
  87 | 
```