# GoodChain L2 — Design Documentation

Central index for frontend design patterns, accessibility rules, and test coverage mapping. Updated **2026-05-22** after RC merge (`9011fc0b..fb12913b`).

## Related docs

| Document | Scope |
|----------|-------|
| [frontend/DESIGN-RESEARCH.md](../../frontend/DESIGN-RESEARCH.md) | Research log, component inventory, DeFi UI references |
| [frontend/WEEKLY_SUMMARY_2026-05-22.md](../../frontend/WEEKLY_SUMMARY_2026-05-22.md) | Frontend health snapshot (security, bundle, a11y grade) |
| [docs/release/RC_COORDINATOR_20260522.md](../release/RC_COORDINATOR_20260522.md) | RC integration verdict, gate results, blockers |
| [docs/autobuilder/goodchain-etoro-100-iter/PRICE_REBALANCE_DESIGN.md](../autobuilder/goodchain-etoro-100-iter/PRICE_REBALANCE_DESIGN.md) | eToro synthetic stocks price/rebalance design |
| [frontend/src/lib/tests/e2eRegistry.json](../../frontend/src/lib/tests/e2eRegistry.json) | Machine-readable route coverage registry |

---

## Release gate status (2026-05-22)

| Gate | Status | Notes |
|------|--------|-------|
| RC merge to `main` | **Merged** | `fb12913b` — GoodChain L2 RC coordinator |
| RC green / production-ready | **Browser gate green** | Full Playwright passed after RC merge; production readiness still needs security/release sign-off |
| `build:e2e:force` | **PASS** | Production `.next.e2e/` build |
| Foundry security suites | **PASS** | 55/55 on integrated security lanes |
| `app-regression` + `analytics` (chromium + mobile-chrome) | **PASS** | 62/62 representative slice |
| `perps-journey.spec.ts` | **PASS post-fix** | 20/20 after receipt-wait + on-chain lane fixes |
| Full Playwright suite | **PASS** | 807 passed, 7 skipped, 0 failed |
| Security npm audit | **Open** | 35 vulns (4 high); Next.js upgrade path documented in weekly summary |
| Testnet guide link-check | **Stabilized** | Transient 429/502/503/504 retries; WC noise filtered |

**Post-deploy note:** frontend deploy completed through `frontend/scripts/deploy.sh`; GoodSwap BUILD_ID/chunk sync was verified live.

---

## RC design changes (9011fc0b..HEAD)

### Perps — mobile tabbed layout (`/perps`)

**Default mobile tab:** `trade` (375px viewport baseline in E2E).

| Tab | Mobile (`< lg`) | Desktop (`≥ lg`) |
|-----|-----------------|------------------|
| **Chart** | Shows price chart + timeframe chips + indicator toggles | Always visible (left column) |
| **Book** | Tab label present; order book grid remains in page flow below tabs (not yet gated by tab state) | Order book / recent trades / open positions always visible |
| **Trade** | Order form, account panel, margin deposit | Always visible (right column, `lg:w-80`) |

**Layout rules:**

- Chart panel: `hidden lg:block` when tab ≠ `chart`; wrapper uses `overflow-hidden`, `min-w-0`.
- Trade column: `hidden lg:block` when tab ≠ `trade`.
- Timeframe chips: wrapped in `ScrollStrip` with `shrink-0` buttons — prevents 375px horizontal overflow.
- Pair selector: horizontal `ScrollStrip` with `ariaLabel="Select perpetual market pair"`.
- Pair info bar: 2-column grid on mobile, inline flex on `sm+` (`data-testid="pair-info-bar"`).
- Open positions panel: `data-testid="open-positions-panel"` for on-chain E2E.

**Submit gating (wallet G$ loading):**

- While `MarginVault.collateral()` loads, fall back to `GoodDollarToken` for balance reads.
- `exceedsMargin` only applies when `walletBalanceReady` — avoids disabling Long/Short during transient zero-balance flash.

**Source:** `frontend/src/app/(app)/perps/page.tsx` — commits `26464853`, `8d7f1341`.

### Transaction state & receipt handling

Perps market orders use a multi-step on-chain flow with explicit receipt confirmation before advancing UI phase.

| Phase | User-facing copy | On-chain step |
|-------|------------------|---------------|
| `idle` | Long/Short {asset} | — |
| `approving` | Approving… | ERC-20 `approve` → **wait for receipt** |
| `pending` | Confirming… | `MarginVault.deposit` (if needed) → **wait for receipt**; then `PerpEngine.openPosition` → **wait for receipt** |
| `done` | Order Placed! | All receipts `status !== 'reverted'` |
| `error` | Truncated error line | Any revert or wagmi failure |

**Design constraint:** Do not mark `done` on transaction hash alone. E2E and users expect confirmed chain state before success messaging.

**Source:** `frontend/src/lib/usePerps.ts` (`waitForTransactionReceipt` on approve, deposit, open).

Margin deposit panel (`MarginFundingPanel`) uses a separate local phase machine (`approving` → `depositing` → `done`) without receipt waits yet — align if deposit flakes appear in E2E.

### Wallet / RainbowKit states

| Context | Behavior | E2E expectation |
|---------|----------|-----------------|
| No wallet | `ConnectButton.Custom` CTAs: "Connect Wallet to Trade/Deposit" | Header shows "Connect Wallet" |
| E2E / invalid `NEXT_PUBLIC_WC_PROJECT_ID` | Extension-only connectors (injected, Coinbase, Safe); **no WalletConnect QR** | Dialog shows "Browser wallet" or "MetaMask", not WC-only |
| Mock wallet (EIP-6963) | Auto-connect may show account button instead of CTA | `connectBtn.or(accountBtn)` visible on app routes |
| Mobile header | Icon-only connect button retains `aria-label` / accessible name | `getByRole('button', { name: /connect wallet/i })` |
| Reown allowlist noise | Console filter for known 403/config-fetch warnings | Filtered in `app-regression` allowed console errors |

**Source:** `frontend/src/lib/wagmi.ts`, `frontend/e2e/wallet.spec.ts`.

### Explore loading skeleton

`/explore/loading.tsx` mirrors the real token table: `<table><thead>…</thead><tbody><tr>…</tr></tbody>`.

**Why:** Suspense fallback during `useSearchParams()` previously used div grids; Playwright counted zero `table tbody tr` rows. Skeleton now matches hydrated markup for deterministic row presence and screen-reader table semantics during load.

**E2E:** `frontend/e2e/explore.spec.ts` — "token rows are present".

### Accessibility contrast fixes

| Area | Fix | Standard |
|------|-----|----------|
| `/predict` pages | `text-goodgreen/80` → full `text-goodgreen` on tinted backgrounds | WCAG AA 4.5:1 normal text |
| Predict market cards | Removed nested `role="button"` on containers with inner buttons | Assistive tech navigation |
| Perps `IndicatorToggle` inactive labels | `text-gray-500` → `text-gray-300`; inactive dot `rgba(156,163,175,0.9)` | Mobile axe on `/perps` |
| Global | Radix focus rings, `ScrollStrip` `aria-label` on filter strips | WCAG 2.1 AA |

**E2E axe sweep:** `frontend/e2e/accessibility.spec.ts` — 14 core routes, zero critical/serious violations.

### Responsive / no-overflow rules

| Rule | Implementation |
|------|----------------|
| Body width ≤ viewport + 5px | Asserted at 375×812 in `mobile-viewport.spec.ts` for `/`, `/perps`, `/stocks`, `/predict`, `/lend`, `/stable` |
| Horizontal chip strips | Always `ScrollStrip` + `shrink-0` children; never bare `overflow-x-auto` with hardcoded fade colors |
| Perps chart header | `flex … min-w-0`, `overflow-hidden` on card |
| Summary rows | `truncate ml-2` on numeric values in order form |
| Mobile touch targets | Order type tabs, leverage presets: `min-h-[44px]` |

### Testnet guide / link-check behavior

`frontend/e2e/testnet-guide-link-check.spec.ts`:

- Retries **429** on internal routes; **429/502/503/504** on GitHub outbound links.
- Capped request timeouts; paced probes to avoid rate-limit flakes masking real broken links.
- Filters expected wagmi WalletConnect config console noise.
- Proof artifacts: `docs/screenshots/testnet-guide.png`, `.autobuilder/screenshots/iter14/_link-check.json`.

**Hygiene note:** Oversized PNG (676 KB → 2.2 MB) flagged for revert/re-capture in release hygiene — not a design regression, but affects repo weight.

---

## Route-specific design patterns

| Route | Pattern | Key components / test IDs |
|-------|---------|----------------------------|
| `/` (swap) | Wallet-gated swap card, UBI fee narrative | `#swap-card`, `data-testid="swap-card"` |
| `/explore` | Table on desktop; skeleton mirrors `<tbody>` rows | `explore/loading.tsx`, `explore.spec.ts` |
| `/perps` | Mobile Chart/Book/Trade tabs; Hyperliquid-inspired dense layout | `open-positions-panel`, `pair-info-bar`, `perps-size-exceeds-cap` |
| `/perps/portfolio` | Positions table; must not leak JSX ternary strings | `e2eRegistry` `mustNotContain` guards |
| `/stocks` | Card layout on mobile, table on desktop | `mobile-viewport.spec.ts` |
| `/predict` | Outcome cards; no nested interactive containers | Full-opacity brand green on tinted badges |
| `/portfolio`, `/*/portfolio` | Empty states + tabbed history | Radix `Tabs` preferred over manual toggle buttons |
| `/testnet-guide` | Scenario anchors + internal route link graph | `testnet-guide-link-check.spec.ts` |
| `/tests` | E2E registry UI mirroring `e2eRegistry.json` | `app-regression.spec.ts` per app id |

Full route list (27 apps): see `e2eRegistry.json` — exercised sequentially by `app-regression.spec.ts`.

---

## Component conventions

| Pattern | Use when | Avoid |
|---------|----------|-------|
| `ScrollStrip` | Category chips, pair selectors, timeframe rows | Ad-hoc `overflow-x-auto` + mismatched gradient |
| `PageSkeleton` / route `loading.tsx` | Suspense boundaries | Spinners that shift layout; div grids pretending to be tables |
| `ConnectButton.Custom` | In-form wallet CTAs matching page button styling | Duplicate connect modals |
| `AmountInput` | Token/size inputs with max + USD hint | Raw `<input>` without labels |
| `PriceDisplay` / `PercentageChange` | All financial values | Inline `$` formatting |
| Radix `Tabs` | Portfolio/history section switches | Manual `button` toggle groups (stocks ticker still has debt) |
| `TransactionProgress` | Multi-step flows with retry | Jumping straight to success on hash |

**Design tokens:** Geist font, HSL CSS variables, `--radius-*`, dark-first. See `frontend/DESIGN-RESEARCH.md` § Design Tokens.

---

## Test coverage mapping

| Design concern | Primary E2E spec | Projects |
|----------------|------------------|----------|
| Route render contracts | `app-regression.spec.ts` | chromium, mobile-chrome |
| WCAG critical/serious | `accessibility.spec.ts` | default |
| 375px overflow | `mobile-viewport.spec.ts` | 375×812 |
| Wallet picker / mock auto-connect | `wallet.spec.ts` | desktop + mobile a11y name |
| Explore skeleton rows | `explore.spec.ts` | chromium |
| Perps mobile + on-chain flow | `perps-journey.spec.ts` | chromium |
| Testnet guide links | `testnet-guide-link-check.spec.ts` | chromium |
| Visual screenshots | `screenshots*.spec.ts`, `surface-sweep.spec.ts` | varies |
| Journey flows | `*-journey.spec.ts` (swap, stocks, predict, lend, stable, portfolio) | chromium |

Registry-driven coverage: each `e2eRegistry.apps[]` entry defines `titlePattern`, `mustContain`, optional `mustNotContain`, and `critical` flag for poll timeouts.

---

## Known constraints & follow-ups

1. **Perps Book tab** — UI tab exists; order book grid is not hidden when Book is inactive on mobile. Either wire `mobileTab === 'book'` gating or remove tab until implemented.
2. **Margin deposit receipts** — Approve/deposit in `MarginFundingPanel` does not yet `waitForTransactionReceipt`; may desync from perps open flow UX.
3. **Stocks detail bundle** — Exceeds budget; dynamic imports documented in DESIGN-RESEARCH but not fully landed.
4. **Manual tab buttons** — Stocks ticker peer-metric toggles should migrate to Radix `Tabs`.
5. **Security** — 4 high-severity npm issues; design work should not block on upgrade but agents must not dismiss audit findings.
6. **WalletConnect in dev** — Without valid `NEXT_PUBLIC_WC_PROJECT_ID`, mobile QR wallets unavailable by design; E2E uses extension/mock paths only.

---

## For future agents / designers

- **Before changing loading UI:** Match final DOM structure expected by Playwright (`table tbody tr`, `data-testid` hooks).
- **Before mobile layout changes:** Run `mobile-viewport.spec.ts` at 375px; check perps tab visibility classes.
- **Before wallet copy changes:** Update `wallet.spec.ts` connector name regex and `app-regression` console allowlist if new benign errors appear.
- **Before declaring RC green:** Full E2E suite + link-check on production URL; coordinator report must show zero blocking failures.
- **Prefer updating this README** for cross-route design decisions; append research notes to `frontend/DESIGN-RESEARCH.md` for historical context.
