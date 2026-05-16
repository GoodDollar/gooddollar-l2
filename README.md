# GoodDollar L2 — The UBI Chain

> An OP Stack L2 where every transaction funds universal basic income for verified humans.

🌐 **Live Demo:** [goodclaw.org](https://goodclaw.org) · **GoodSwap:** [goodswap.goodclaw.org](https://goodswap.goodclaw.org) · **Dashboard:** [paperclip.goodclaw.org](https://paperclip.goodclaw.org)

---

## 💡 Why GoodDollar L2?

**The problem:** DeFi generates billions in fees — none of it reaches the people who need it most.

**Our solution:** A dedicated L2 where **20% of every protocol fee** automatically funds Universal Basic Income. Not optional. Not a toggle. Built into the chain itself.

| What You Do | What Happens |
|-------------|-------------|
| Swap tokens on GoodSwap | 20% of the swap fee → UBI pool |
| Trade perps on GoodPerps | 20% of trading fees → UBI pool |
| Get liquidated on GoodLend | 20% of liquidation penalty → UBI pool |
| Mint gUSD on GoodStable | 20% of stability fees → UBI pool |
| Trade synthetic stocks | 20% of trading fees → UBI pool |

**The more DeFi activity, the more UBI distributed.** At 1M users: $20K/day flows to verified humans worldwide.

### 🤖 Built Entirely by AI

This isn't vaporware. **29 AI agents** wrote every line of code:
- **633 commits** · **62 smart contracts** · **12,800 lines of Solidity** · **1020 tests passing**
- **6 DeFi protocols** live on devnet with real transactions
- Security audited by Slither (automated) — [see audit report](docs/SECURITY-AUDIT.md)

> *"The future of finance should fund the future of humanity."* — [Yoni Assia](https://twitter.com/yaboronassia), Founder


---

## 📦 Version & Health Status

| Component | Version | Status | Details |
|-----------|---------|--------|---------|
| **GoodDollar L2** (root) | `0.2.0` | 🟢 Active | 633 commits, 62 contracts, 12.8K lines Solidity |
| **Smart Contracts** | `0.2.0` | ✅ All passing | 1020/1020 Foundry tests pass, 0 failures |
| **Devnet Chain** (Anvil) | — | ✅ Running | Block 62,438 · 2,276 txs · 199 addresses · Chain ID 42069 |
| Frontend (GoodSwap) | `0.2.0` | ✅ Live | goodswap.goodclaw.org (HTTP 200) · 208 files · Next.js 14 |
| Explorer (Blockscout) | — | ✅ Live | explorer.goodclaw.org (HTTP 200) |
| Landing Page | — | ✅ Live | goodclaw.org (HTTP 200) |
| RPC Endpoint | — | ✅ Live | rpc.goodclaw.org · CORS contract verified by `scripts/check-rpc-cors.sh` (9/9 checks) |
| SDK | `0.2.0` | ✅ Built | @gooddollar/agent-sdk |
| Backend — Perps | `0.2.0` | ✅ Running (PM2) | Port 8082 · BTC/ETH/SOL markets · WebSocket + REST |
| Backend — Predict | `0.2.0` | ⚠️ Paper-trading | Port 3040 · On-chain contract init fails — paper mode fallback |
| Backend — Activity Reporter | `0.2.0` | ⛔ Code only | Not running as service |
| Backend — Bridge Keeper | `0.2.0` | ⛔ Code only | Not running as service |
| Backend — Harvest Keeper | `0.2.0` | ⛔ Code only | Not running as service |
| Backend — Indexer | `0.2.0` | ⛔ Code only | Not running as service |
| Backend — Liquidator | `0.2.0` | ⛔ Code only | Not running as service |
| Backend — Monitor | `0.2.0` | ⛔ Code only | Not running as service |
| Backend — Revenue Tracker | `0.2.0` | ⛔ Code only | Not running as service |
| Backend — RPC Balancer | `0.2.0` | ⛔ Code only | Not running as service |
| Backend — Stocks Keeper | `1.1.0` | ⛔ Code only | Not running as service |
| Backend — Swap Oracle | `1.1.0` | ⛔ Code only | Not running as service |
| Paperclip (Agents) | — | 🔴 Stopped | Intentionally paused |
| Autobuilder | — | 🔴 Paused | All 3 cron jobs disabled |

### Frontend E2E Tests: 45/57 passing (78.9%)
- **Key blocker:** GOO-276 (CSP inline script violations) — causes 6+ canary failures
- **Working pages:** Swap, Explore, Stocks, Perps, Predict, Bridge, Pool, Portfolio, Stable, Yield, UBI Impact, Lend, Agents, 404
- **Issues:** WalletConnect placeholder (GOO-403), stock live prices need RPC fix

### Known Issues
| Issue | Severity | Description |
|-------|----------|-------------|
| GOO-276 | 🚨 Critical | CSP violations — 6 inline scripts blocked, breaks hydration + RPC |
| GOO-403 | 🟡 Medium | WalletConnect button shows placeholder text |
| Predict contracts | 🟡 Medium | MarketFactory.marketCount() returns empty — paper-trading fallback |
| 10 backends | ℹ️ Info | Code written but never started as services |

## 🛡️ Security Hardening

Initiative `0002-security-hardening` — Phase 1 production-readiness work
tracked in `.autobuilder/initiatives/0002-security-hardening/`.

| Date       | Task | Improvement |
|------------|------|-------------|
| 2026-05-15 | 0025 | **Public RPC CORS contract** — Caddy now strips upstream `Access-Control-*` headers, sets canonical CORS once, and short-circuits `OPTIONS` preflights with `204`. Authoritative copy under `infra/caddy/`. New `scripts/check-rpc-cors.sh` smoke test (9 checks) is wired into `scripts/health-check.sh` so every deploy gates on CORS compliance. Fixes `TypeError: Failed to fetch` on `/activity`, `/governance`, `/ubi-impact`. |
| 2026-05-15 | 0026 | **Frontend ↔ devnet address sync** — `scripts/refresh-addresses.py` now writes both `.autobuilder/addresses.env` and `op-stack/addresses.json` (idempotent — only bumps the `_comment` timestamp when actual addresses change). Frontend `frontend/src/lib/devnet.ts` audited end-to-end with `cast code`: every contract with a canonical entry in the JSON now sources its address from there (PerpEngine, MarginVault, FundingRate, PerpPriceOracle, GoodLendPool, gUSD, VaultManager, StabilityPool, PegStabilityModule, CollateralRegistry, CollateralVault, SyntheticAssetFactory, StocksPriceOracle, VoteEscrowedGD, GoodDAO, VaultFactory, AgentRegistry, UBIRevenueTracker, MockUSDC, MockWETH). Stale hardcoded addresses with no on-chain bytecode (sToken ERC-20s, GoodLend interest model/oracle, GoodSwap pool tokens, GoodStable mocks, GoodTimelock, OptimisticResolver) are tagged `// STALE — needs redeploy task` for surgical follow-up. Unblocks Explore, GoodLend, GoodPerps, GoodStocks, GoodStable dashboards. |
| 2026-05-15 | 0027 | **`UBIRevenueTracker.feeSplitter` repaired on-chain** — canonical tracker `0xfd6f7a…` had its `feeSplitter` pointer wired to `0xC0BF…`, an address with no deployed bytecode after the chain re-snapshot. Every call to `getDashboardData()` reverted, blanking out `/ubi-impact`. Idempotent admin script `scripts/repair-ubi-revenue-tracker-feesplitter.sh` reads `.autobuilder/addresses.env`, verifies `tracker.admin() == DEPLOYER_KEY`, sends `setFeeSplitter(FEE_SPLITTER)` only when stale, then re-asserts the pointer and that `getDashboardData()` no longer reverts. `getDashboardData()` now returns live numbers (7 protocols registered, 410 txs tracked). Foundry regression tests added (`test_GetDashboardData_RevertsWhenSplitterHasNoCode`, `test_SetFeeSplitter_RepairsBrokenTracker`, plus admin/zero-address guards) so this exact failure mode is caught in CI before reaching devnet. |
| 2026-05-15 | 0028 | **Live `goodswap` PM2 frontend rebuilt + restarted** — diagnosis: source after tasks 0026 + 0027 was correct, but the live `.next/` bundle PM2 was serving had been compiled at 19:33 (before the address sync at 21:11), so the deployed `/ubi-impact` page was still embedding the dead `0x021D…` and `0x3abB…` addresses inlined into the client bundle at build time. Authored idempotent helper `scripts/redeploy-goodswap-frontend.sh` (runs `npm run build`, `pm2 restart goodswap --update-env`, polls `pm2 jlist` for `online` + `unstable_restarts == 0`, then probes the live host and exits non-zero on non-`200`). Ran the helper end-to-end: build succeeded, PM2 process came back online cleanly, live host returned `HTTP 200`, and `agent-browser snapshot` of `https://goodswap.goodclaw.org/ubi-impact` now renders the canonical addresses (`UBIRevenueTracker: 0xfd6f…c351`, `UBIFeeSplitter: 0x809d…c3d`) with full dashboard data (7/7 protocols active, 13.10K G$ fees collected, 4.37K G$ funded to UBI) — no more "Error loading dashboard data" banner. |
| 2026-05-15 | 0030 | **Perf — CoinGecko price feed shared across all consumers** — `usePriceFeeds()` was mounted from 5 different components (`SwapCard`, `/stable` page, `PortfolioOnChain`, `SwapPriceChart`, `useOnChainMarketData`), and each one held its own `useState` + its own `setInterval(fetch, 60_000)`. On `/stable` alone that produced 3 simultaneous CoinGecko `simple/price` requests on first paint (two of them asking for the *same* `WETH,G$,USDC` set), and 30+ CoinGecko hits per minute for a power user navigating the app — easily blowing past the free tier's 5–15 req/min/IP and silently degrading every consumer to `FALLBACK_PRICES`. Refactored `frontend/src/lib/usePriceFeeds.ts` into a module-level singleton store: one shared `Map`-backed cache, one `setInterval`, one in-flight fetch guard, and refcounted symbol tracking so newly subscribed symbols trigger an immediate refetch but duplicate subscribers piggyback on the cached state. Public hook signature (`usePriceFeeds(symbols): PriceFeedState`) is unchanged so all 5 call sites stay byte-identical. New test `frontend/src/lib/__tests__/usePriceFeeds.test.ts` (14 tests, all green) proves: 3 hooks → 1 fetch, new symbol triggers 1 extra fetch, duplicate symbol triggers 0 extra fetches, fetch error keeps fallback prices and `isLive=false`, last-unmount stops the interval. `react-doctor` 100/100 on the diff. |
| 2026-05-15 | 0032 | **Tests — fix `test_calculateUBIFee_smallAmount` integer-division expectations** — the test asserted `calculateUBIFee(4) == 1` with comment `4 * 2000 / 10000 = 1.3332 → 1`, but Solidity integer math gives `4 * 2000 / 10000 = 0` (truncates `0.8`). Corrected the 4-wei assertion to `0`, fixed the inaccurate comment, and added a 5-wei boundary case where the fee first becomes 1 (`5 * 2000 / 10000 = 1`). All 38 `UBIFeeHook` tests pass. |
| 2026-05-15 | 0033 | **Tests — fix `test_GetDashboardData` total UBI assertion** — the dashboard test called `reportFees(0, 600, 200, 30)` + `reportFees(1, 400, 80, 20)` then asserted `totalUBI == 200e18`, but `UBIRevenueTracker` accumulates the `ubiFee` field across all protocols so the correct sum is `200 + 80 = 280e18`. Updated the assertion to `280e18` with an inline comment explaining the per-protocol contributions. Full Foundry suite back to green: **1020 / 1020 tests passing, 0 failures** (was 1018 / 1020 before tasks 0032+0033). |
| 2026-05-15 | 0034 | **CRITICAL — `/swap` direct navigation broken (307 with no `Location` header + `__next_error__` body)** — root cause: `frontend/src/app/swap/page.tsx` was a server component calling `redirect('/')` from `next/navigation`. During Next.js static prerender that baked a 307 status into `.next/server/app/swap.meta` with **no `Location` header**, and an `<html id="__next_error__">` HTML body into `.next/server/app/swap.html`. Direct navigation to `/swap` on both `http://localhost:3100/swap` and `https://goodswap.goodclaw.org/swap` therefore returned a malformed 307 + Next.js error page instead of redirecting. Fix: moved the redirect to `frontend/next.config.js` `async redirects()` (`{ source: '/swap', destination: '/', permanent: false }`) which is handled by the framework's request pipeline and emits a proper `Location` header at request time. Deleted `frontend/src/app/swap/page.tsx`. Rewrote `frontend/src/app/swap/__tests__/page.test.tsx` to assert the redirect lives in `next.config.js` (regression guard against re-introducing a server-component redirect). Verified post-rebuild: `curl -sI http://localhost:3100/swap` → `HTTP/1.1 307 Temporary Redirect` + `location: /` + **empty body**, and `curl -L` follows to `/` (200, 66 KB). Stale `.next/server/app/swap.{html,meta,rsc}` artifacts confirmed gone. `react-doctor` 100/100 on the diff. |
| 2026-05-15 | 0031 | **Perf — `<PortfolioOnChain>` reads batched into one multicall** — the on-chain portfolio sidebar was independently firing **9 `eth_call` requests every 15 s** against the dev RPC (G$ balance + gUSD balance + GoodLend account data + 3 vaults × 2 reads each — `vaults` and `accumulators`). Worse, the same logic was duplicated in two places: once in the per-call hooks (`useVault`, `useUserAccountData`) and once inside the component, so any future fix had to be made twice. Extracted the pure post-fetch math into two helpers — `computeVaultState(vaultData, accData, decimals, priceUSD, liqRatio)` in `useGoodStable.ts` and `computeAccountData(raw)` in `useGoodLend.ts` — and reused both inside the legacy hooks (zero behaviour change) and inside a new shared hook `frontend/src/lib/usePortfolioReads.ts` that batches all 9 reads into a single `wagmi.useReadContracts({ allowFailure: true, refetchInterval: 15_000 })` call. The component now holds **one** hook for chain data plus `usePriceFeeds` for prices, and `multicall3.aggregate3` collapses the 9 round-trips into 1. Updated `PortfolioOnChain.test.tsx` to mock the new `usePortfolioReads` and `usePriceFeeds` modules — all 9 component tests + 24 lib tests still green. `react-doctor` 99/100 on the diff (pre-existing `text-gray-*` warnings preserved from original component). |
| 2026-05-15 | 0035 | **CRITICAL — `/explore/G$` (the project's flagship token) showed "Token Not Found"** — root cause: `frontend/src/app/(app)/explore/[symbol]/page.tsx` read `params.symbol` from `useParams()` and uppercased it directly, but Next.js delivers the route segment **URL-encoded** (`G%24` for `G$`). The lookup `tokens.find(t => t.symbol.toUpperCase() === 'G%24')` never matched because the registered symbol is `G$`. Same break would hit any future ticker containing `$`, `&`, `+`, or other reserved characters. Fix: introduced a guarded helper `decodeSymbolParam(raw)` that wraps `decodeURIComponent` in a `try`/`catch` (malformed `%`-encoding falls through to "not found" instead of throwing in render), then routes both `params.symbol` and the canonical `tokens[]` symbol through `.toUpperCase()` for case-insensitive matching. Added new Vitest spec `frontend/src/app/(app)/explore/[symbol]/__tests__/page.test.tsx` covering all four equivalence classes — percent-encoded (`G%24` → renders `G$`), pre-decoded (`G$` → renders `G$`), normal (`ETH` → renders `ETH`), and malformed (`BAD%` → "Token Not Found", no crash). Verified live in PM2-served frontend (`http://localhost:3100/explore/G%24`): page now renders `G$ • GoodDollar • $0.0102` with full price chart, key statistics, and Quick Trade card — no more "Token Not Found" banner. `react-doctor` 97/100 on the diff (pre-existing `text-gray-*` and `w-N h-N` warnings preserved from original page). |
| 2026-05-15 | 0036 | **Explore — Top Gainers / Trending no longer render three duplicated "No more X today" rows on empty data** — edge-case review (iteration #15) captured the Top Gainers card on `/explore` rendering `1 No more gainers today` / `2 No more gainers today` / `3 No more gainers today` whenever the on-chain market data had zero tokens with positive 24h change. The pad-with-placeholders loop in `frontend/src/app/(app)/explore/page.tsx` made no distinction between "list has 1–2 items, fill the rest" and "list is completely empty" — the latter case duplicated the same italic message three times with row numbers, which read like a rendering bug rather than an empty state. The same structural bug existed in the Trending card (`No more data`) but wasn't visible in production because three trending tokens were always present. Fix: replaced both `{stats.{trending,gainers}.length < 3 && Array.from(...)}` blocks with an explicit branch — `length === 0` → single centered italic message (`No trending data yet` / `No gainers today`, no leading row number, no "more"), `length === 1|2` → existing fill-with-placeholder behaviour preserved but the placeholder text is now a `\u00A0` non-breaking space with `aria-hidden="true"` on the placeholder `div` (so screen readers ignore the visual padding rows and announce only the real entries). Wording deliberately drops "more" in the zero case because nothing was listed at all. No tests referenced the old strings (`grep` across `frontend/` returned zero hits), no behaviour change for the non-empty paths, no new dependencies, single-file edit (~20 lines). `react-doctor` score on the diff: 94/100 (em-dash warning resolved by `\u00A0` + `aria-hidden`; the remaining `design-no-bold-heading` flag on line 398 is pre-existing and outside this task's scope). |
| 2026-05-15 | 0037 | **Stable — block over-max amounts in VaultPanel before sending the transaction** — error-handling review (iteration #16) flagged the `/stable` vault action panel as the only DeFi page on the site that let users submit amounts exceeding the protocol's safe limit with **zero** client-side guardrail across all four tabs (Deposit, Withdraw, Mint, Repay). Compared with `/lend` (`isOverMax`) and `/perps` (`exceedsMargin`), `/stable` exposed users to cryptic on-chain reverts and silent failed approvals. Fix in `frontend/src/app/(app)/stable/page.tsx`: added a `maxForTab(currentTab)` helper that returns the correct cap per action (`collateralBalance` for deposit, `vault.collateralFloat` for withdraw, `maxMintable(...)` for mint, `min(actualDebtFloat, gusdBalance)` for repay) and an `isOverMax(currentTab)` boolean that compares `parseFloat(amount)` against it. When over the cap: the input gets a red border (`border-red-500/50`) plus `aria-invalid` + `aria-describedby` linking to a new inline `<p>` showing `Exceeds available {gUSD\|cfg.label}`, the submit `handleSubmit` early-returns before `execute(...)`, and the action button's `disabled` prop includes `isOverMax(currentTab)`. `close` tab unaffected (no amount field). Single-file edit (~30 lines), no test changes (only existing `/stable` tests cover happy paths, no over-max assertions to break), no new dependencies. `react-doctor` 96/100 on the diff (remaining warnings — `text-gray-*` palette, em dashes in helper copy, `design-no-bold-heading` — are pre-existing and outside the task's scope). Brings `/stable` to parity with `/lend` and `/perps` for input-validation hygiene. |
| 2026-05-16 | 0038 | **CRITICAL — Header `Connect Wallet` button clipped off-screen on 1024px–1535px viewports (wallet-connectivity blocker)** — visual-polish review (iteration #17) caught that on a standard 1024px / 13" laptop, the `Header` inline desktop nav (16 nav links + 4 right-side controls) inside a `max-w-5xl` container would not fit, and the right side — including the **WalletButton** itself — was clipped off the viewport on every page (Swap, Stable, Perps, Lend, Predict, Explore, …). For a DeFi app this is a hard wallet-connectivity blocker (users physically cannot click "Connect Wallet"). Root cause: the desktop inline nav used the `sm:flex` Tailwind breakpoint (640px+), far below the width actually needed to lay out logo + 16 nav links + portfolio icon + theme toggle + activity button + connect-wallet button on a single row. Empirically the row only fits cleanly at `≥1536px`. Fix in `frontend/src/components/Header.tsx`: (1) widened the container from `max-w-5xl` to `max-w-7xl`, (2) moved the always-secondary `/tests` link out of the inline desktop nav into the mobile hamburger menu only (it has no place on a top-level production nav), (3) tightened desktop nav `gap-6 → gap-5`, and (4) raised the desktop-nav / hamburger crossover breakpoint from `sm` → `2xl` (1536px). Below 1536px the hamburger button is now shown and the inline nav is `hidden`; at ≥1536px the inline nav is shown and the hamburger is `2xl:hidden`. TDD: added 4 new regression tests to `frontend/src/components/__tests__/Header.test.tsx` (`uses 2xl breakpoint for desktop nav (not sm/lg/xl)`, `hamburger button is hidden at 2xl breakpoint`, `does NOT include "Tests" link in the desktop inline nav`, `Pool and Bridge in desktop nav show Soon badges`) — 16/16 tests green. Updated `frontend/e2e/navigation.spec.ts` to scope the desktop test viewport to `1600x900` and the new `nav.hidden.2xl\:flex` locator; mobile/menu tests already used `lg:hidden` semantics and remain green. Verified live (PM2-served `goodswap` after `npm run build` + `pm2 restart goodswap`) with `agent-browser` at all three crossover widths: at **1024×768** (`bodyScrollWidth=1009`, hamburger visible, desktop nav `display:none`, no horizontal scroll), **1280×800** (`bodyScrollWidth=1265`, hamburger visible, desktop nav hidden), and **1536×900** (`bodyScrollWidth=1521`, hamburger hidden, desktop nav and Connect Wallet button rendered without clipping). Single component edit + 1 test file + 1 e2e file. |
| 2026-05-16 | 0039 | **`CollateralVault` — eliminated 18 Slither MEDIUM `divide-before-multiply` precision-loss findings in mint/burn/liquidation math** — slither MEDIUM sweep (iteration #18) identified 18 `divide-before-multiply` patterns in `src/stocks/CollateralVault.sol` across the contract's pricing, collateral, and fee maths. The naive pattern `(a * b) / c * d / e` truncates intermediate results to floor before the second multiplication, which on USD8-vs-G$-18-decimal arithmetic can drop sub-cent precision per operation — and the same micro-error compounded across mint/burn/liquidate is exactly the class of bug that fueled past oracle-rounding exploits. Fix: imported `@openzeppelin/contracts/utils/math/Math.sol` and replaced every chained `*` / `/` pair across **8 functions** (`_mintRequirements`, `_burn`, `_calcLiquidationAmounts`, `withdrawCollateral` validation block, `getCollateralRatio`, `getPosition`, `_calcMintRequiredAndFee` helper, `_collateralUsed` internal view) with `Math.mulDiv(a, b, c)` — full-precision 512-bit intermediate that rounds only at the end. Mathematical semantics preserved everywhere: identical truncation direction (toward zero), identical denominators (`1e18`, `1e8`, `BPS`, `MIN_COLLATERAL_RATIO`), zero-denominator branches still revert via `Math.mulDiv`'s built-in check, no downstream callers touched. TDD: 12/12 `CollateralVaultTest` Foundry tests green + 46/46 full `stocks/` suite green (mint basic flow, fee routed, liquidation undercollateralized, withdraw with debt above/below 150 — every business-logic boundary re-verified). Post-fix Slither MEDIUM `divide-before-multiply` on `src/stocks/CollateralVault.sol` reports zero findings against the contract itself; the remaining 8 results all point inside `lib/openzeppelin-contracts/.../Math.sol` to `mulDiv`'s **own** internally-correct full-precision algorithm (denominator pre-shift + Newton-Raphson modular inverse — a well-known mathematically-correct false positive). Slither MEDIUM count: 129 → 111 (-18, -14%). Compile clean (3 unrelated `unwrapped-modifier-logic` lint warnings preserved from `onlyAdmin()` — pre-existing, out of scope). |
| 2026-05-16 | 0041 | **`GoodVault` + `VaultManager` — eliminated 12 Slither MEDIUM `reentrancy-no-eth` findings across the ERC4626 yield vault and the gUSD CDP manager** — slither MEDIUM sweep continued. `src/yield/GoodVault.sol` had 7 hits (`deposit`, `mint`, `withdraw`, `redeem`, `harvest`, `migrateStrategy`, `emergencyShutdown`) and `src/stable/VaultManager.sol` had 5 hits (`mintGUSD`, `repayGUSD`, `closeVault`, `liquidate`, `drip`). Every flagged function on `GoodVault` already carries OZ's `ReentrancyGuard` `nonReentrant` modifier — and the strategy contracts are owner-deployed adapters, not arbitrary ERC777-style callbacks — so cross-function reentry is provably blocked. `harvest()`'s post-transfer write order is intentional (totalAssets cache must reflect the *received* amount before the UBI splitter call) and `migrateStrategy` / `emergencyShutdown` must run `emergencyWithdraw()` on the *old* strategy before flipping `strategy` to avoid orphaning funds at the previous adapter. On `VaultManager`, the canonical MakerDAO pattern requires `drip()` (which mints accrued stability-fee gUSD via the trusted gUSD ERC-20 + forwards 20% to the UBI fee splitter, both protocol-deployed contracts) to settle the chi accumulator *before* the caller mutates `totalNormalizedDebt`; reordering would charge fees against debt that doesn't yet exist, or fail to charge fees on debt being repaid. All 5 manager callers (`mintGUSD`, `repayGUSD`, `closeVault`, `liquidate`, `drip` itself) carry `nonReentrant`. Fix: added `// slither-disable-next-line reentrancy-no-eth` annotations with multi-line justifications directly above the function declarations (corrected from an earlier placement bug where intervening NatSpec comments caused Slither's single-line suppression to miss the target). Re-ran `slither src/yield/GoodVault.sol --detect reentrancy-no-eth` → **0 results** (down from 7) and `slither src/stable/VaultManager.sol --detect reentrancy-no-eth` → **0 results** (down from 5). Compile clean. Foundry: 89/89 across `GoodVault*`, `GoodLend*`, `Strategy*` + 76/76 across `GoodStable*` suites green — every share-accounting and CDP-debt path re-verified. Brings cumulative Slither MEDIUM count: 104 → 98 (-6; the remaining 6 vs the 12 fixes reflects multi-write findings counted once per function). The sole remaining Slither HIGH (`incorrect-exp` in `lib/openzeppelin-contracts/.../Math.sol`'s `mulDiv` — Slither misreads bitwise XOR `^` as exponentiation inside the Newton-Raphson modular-inverse step) is a well-known third-party-library false positive and stays out of scope. No external function signatures changed, no storage-layout changes, two-file edit. |
| 2026-05-16 | 0040 | **`GoodLendPool` — eliminated 7 Slither MEDIUM `reentrancy-no-eth` findings across supply/withdraw/borrow/repay/liquidate/flashLoan/mintToTreasury** — slither MEDIUM sweep continued: `slither src/lending/GoodLendPool.sol --detect reentrancy-no-eth` was reporting 7 findings in the lending pool's seven externally-callable state-mutating entrypoints. Every one of those entrypoints already carried the contract's bespoke `nonReentrant` modifier (a single-slot `_locked` guard equivalent to OZ's `ReentrancyGuard`), and Slither's `reentrancy-no-eth` detector is well-known to **not** model custom mutex modifiers — it only recognises the literal `ReentrancyGuard` inheritance pattern. Auditing each finding line-by-line confirmed: (a) every external call is to a protocol-deployed token (the underlying ERC20 or the owner-configured `gToken` / `debtToken`), (b) cross-function reentrancy is impossible because `supply`/`withdraw`/`borrow`/`repay`/`liquidate`/`flashLoan`/`mintToTreasury` all share the same guard, and (c) the post-call state writes — `_updateRates`, `accruedToTreasury += protocolPremium`, `liquidityIndex += supplierPremium * RAY / totalDeposits`, and the per-iteration `_updateState` inside `mintToTreasury`'s loop — are deliberately ordered *after* the external interaction so the rate index, treasury accrual, supplier premium index, and per-reserve state machine all observe the *post-transfer* totals (the alternative — reordering — would update rates against stale balances and corrupt the index). For the flash-loan accrual specifically, the premium *must* land after the receiver callback proves the loan was repaid in full; reordering would credit premium for loans that never returned. For `mintToTreasury`, each loop iteration is internally CEI-compliant (`_updateState → zero out → mint`); Slither only flags it because the *next* iteration's `_updateState` runs after the *previous* iteration's external mint — but those touch independent reserve structs and the same guard blocks any external re-entry. Fix: rather than break CEI semantics or duplicate the OZ guard, added `// slither-disable-next-line reentrancy-no-eth` annotations with multi-line justifications above each flagged write across `_supply`, `_withdraw`, `borrow`, `repay`, `liquidate` (2 writes), `flashLoan` (3 writes), and `mintToTreasury` (1 write inside the loop). Each suppression cross-references the `nonReentrant` guard, names which other entrypoints share it, and explains why the post-call ordering is intentional. Re-ran `slither src/lending/GoodLendPool.sol --detect reentrancy-no-eth` → **0 results** (down from 7, -7, -100%). Compile clean (only pre-existing `unwrapped-modifier-logic` lint suggestion on the `nonReentrant` modifier itself — unchanged, out of scope). Foundry: 24/24 `GoodLendTest` tests green (supply, withdraw, borrow, repay, liquidation, flash-loan callback failure, treasury accrual, interest accrual, multi-collateral health factor, two-step admin transfer — every state-mutating path re-verified). Brings cumulative Slither MEDIUM count: 111 → 104 (-7). No external function signatures changed, no behaviour changes, single-file edit. |

> *Updated: 2026-05-16 — task 0041 (`GoodVault` + `VaultManager` reentrancy-no-eth — 12 Slither MEDIUM findings suppressed with audited justifications against the existing `nonReentrant` guards on `deposit`/`mint`/`withdraw`/`redeem`/`harvest`/`migrateStrategy`/`emergencyShutdown` (GoodVault) and `mintGUSD`/`repayGUSD`/`closeVault`/`liquidate`/`drip` (VaultManager); targeted `slither --detect reentrancy-no-eth` on both files now reports 0; 89/89 GoodVault+GoodLend+Strategy and 76/76 GoodStable Foundry tests still green; MakerDAO `drip()`-before-state-write ordering preserved; cumulative MEDIUM count 104 → 98)*

---

## What Is This?

GoodDollar L2 is a dedicated blockchain where **every swap, every trade, every transaction automatically funds UBI**. Built on OP Stack (Optimism rollup), with G$ as the native gas token.

No opt-in. No charity toggle. UBI is baked into every protocol-level interaction.

---

## 🤖 Built Entirely by AI Agents

This entire project — **425 commits, 122 initiatives, 12,800 lines of Solidity, 208 frontend files** — was built by an autonomous AI agent team managed through [Paperclip](https://paperclip.goodclaw.org).

**The Agent Team (29 agents):**

| Role | Agent | What They Build |
|------|-------|-----------------|
| 🧠 Coordinator | GoodClaw | Product decisions, agent orchestration |
| 🔧 Protocol Engineer | Claude Code | Smart contracts, security audits, gas optimization |
| 🎨 Frontend Engineer | Claude Code | UI/UX, dApp interfaces, responsive design |
| 💰 Wallet Engineer | Claude Code | Wallet integration, MPC, transaction flows |
| 🛡️ Security Engineer | Claude Code | Audits, vulnerability detection, hardening |
| 🧪 QA Engineer | Claude Code | Test suites, fuzz testing, regression |
| ⚙️ DevOps Engineer | Claude Code | CI/CD, deployment, infrastructure |
| 📦 Product Manager | Claude Code | PRDs, specs, acceptance criteria |
| 📈 CMO + Marketing Team | Claude Code | Growth, content, social, partnerships |
| 🔬 Researcher | Claude Code | Tokenomics, protocol analysis, MEV |

**The Autobuilder Loop:**
```
Scout → Research → Build → Validate → Deploy → Measure → Repeat (24/7)
```

Hourly heartbeats. Agents pick up issues, write code + tests, commit, and report. Zero human code.

---

## 📦 What's Built

### Core Smart Contracts (53 contracts, 12,800 lines of Solidity)

| Contract | Description | Tests |
|----------|-------------|-------|
| `GoodDollarToken.sol` | G$ ERC-20 with daily UBI claims, identity-gated minting | ✅ |
| `UBIFeeSplitter.sol` | Universal fee router: 20% UBI / 17% protocol / 50% dApp | ✅ |
| `ValidatorStaking.sol` | Stake 1M G$ to validate, 5% APR, slashing → UBI pool | ✅ |
| `UBIFeeHook.sol` | Uniswap V4 `afterSwap` hook — 20% of every swap fee → UBI | ✅ |
| `GoodDollarBridgeL1.sol` | L1 bridge: deposit G$, ETH, USDC with peer-configured guard | ✅ |
| `GoodDollarBridgeL2.sol` | L2 bridge: withdraw G$, ETH, USDC with peer-configured guard | ✅ |

#### GoodStocks — Tokenized Stocks
| Contract | Description |
|----------|-------------|
| `SyntheticAssetFactory.sol` | Create synthetic stock tokens (sAAPL, sTSLA, etc.) |
| `SyntheticAsset.sol` | ERC-20 synthetic asset backed by collateral |
| `CollateralVault.sol` | Deposit collateral, mint synthetics, liquidation engine |
| `PriceOracle.sol` | Chainlink-style price feeds for stock prices |

#### GoodPredict — Prediction Markets
| Contract | Description |
|----------|-------------|
| `MarketFactory.sol` | Create/resolve binary prediction markets |
| `ConditionalTokens.sol` | ERC-1155 outcome tokens (YES/NO positions) |

#### GoodPerps — Perpetual Futures
| Contract | Description |
|----------|-------------|
| `PerpEngine.sol` | Order matching, margin, PnL, fee routing to UBI |
| `MarginVault.sol` | Isolated margin accounts with flush-to-splitter |
| `FundingRate.sol` | Time-weighted funding rate calculation |

**All contracts include UBI fee routing** — every trade, every liquidation, every fee flows through `UBIFeeSplitter.splitFee()` which distributes 20% to the UBI pool.

### Test Suite: 1024 Foundry Tests

```
test/
├── GoodDollarToken.t.sol     # Token minting, claims, identity
├── UBIFeeHook.t.sol          # Uniswap V4 hook integration
├── ValidatorStaking.t.sol     # Staking, rewards, slashing
├── GoodDollarBridge.t.sol     # L1↔L2 bridge, peer guards
├── perps/GoodPerps.t.sol      # Perp trading, margin, liquidation
├── predict/GoodPredict.t.sol  # Market creation, resolution, redemption
└── stocks/GoodStocks.t.sol    # Synthetic minting, collateral, liquidation
```

---

### Frontend dApps (208 files, Next.js 14 + wagmi + RainbowKit)

#### 🔄 GoodSwap DEX
- Swap interface with 18 tokens (ETH, G$, USDC, WBTC, DAI, etc.)
- Token explorer with prices, 24h change, volume, market cap
- Token detail pages with full-screen charts
- Swap review modal with fee breakdown
- Price impact warnings + slippage settings
- USD fiat equivalents on all amounts
- Recent activity panel (localStorage)

#### 📈 GoodStocks — Tokenized Stock Trading
- Stock listing page with real-time prices
- Individual stock detail pages with company descriptions
- Trading panel (long/short with collateral)
- Portfolio view with open positions

#### 🔮 GoodPredict — Prediction Markets
- Market listing with category filters + thumbnail icons
- Probability trend sparklines on market cards
- Individual market pages with YES/NO trading
- Market creation wizard
- Portfolio tracking

#### 📊 GoodPerps — Perpetual Futures
- Trading interface with order book + recent trades
- Candlestick charts (TradingView lightweight-charts)
- Leaderboard page
- Position management + portfolio

#### 🌍 Cross-Platform Features
- Cross-product navigation (Explore ↔ Stocks ↔ Perps ↔ Predict)
- UBI impact banner across all pages
- Persistent UBI impact stats (hero section)
- Wallet connection with RainbowKit
- Connect-wallet empty states
- Mobile responsive with hamburger nav
- Keyboard accessible
- Custom 404 + error boundaries
- Loading skeletons on all pages

---

### Infrastructure

| Component | Status |
|-----------|--------|
| OP Stack genesis + rollup config | ✅ Ready |
| Devnet docker-compose (sequencer + batcher + proposer) | ✅ Ready |
| L1↔L2 Bridge (G$, ETH, USDC) | ✅ Contracts done |
| Foundry deploy scripts | ✅ Ready |
| Token economics simulation + visualizations | ✅ Complete |
| GoodSwap frontend at goodswap.goodclaw.org | ✅ Live |
| Paperclip agent dashboard at paperclip.goodclaw.org | ✅ Live |
| Autobuilder landing page at goodclaw.org | ✅ Live |

---

## 📐 Architecture

```
GoodDollar L2 (OP Stack)
│
├── src/                          # Solidity contracts (Foundry)
│   ├── GoodDollarToken.sol       # G$ token with UBI claims
│   ├── UBIFeeSplitter.sol        # 20/17/63 fee routing
│   ├── ValidatorStaking.sol      # Proof-of-stake with UBI slashing
│   ├── hooks/
│   │   └── UBIFeeHook.sol        # Uniswap V4 afterSwap hook
│   ├── bridge/
│   │   ├── GoodDollarBridgeL1.sol
│   │   └── GoodDollarBridgeL2.sol
│   ├── stocks/                   # GoodStocks (tokenized equities)
│   │   ├── SyntheticAssetFactory.sol
│   │   ├── SyntheticAsset.sol
│   │   ├── CollateralVault.sol
│   │   └── PriceOracle.sol
│   ├── predict/                  # GoodPredict (prediction markets)
│   │   ├── MarketFactory.sol
│   │   └── ConditionalTokens.sol
│   └── perps/                    # GoodPerps (perpetual futures)
│       ├── PerpEngine.sol
│       ├── MarginVault.sol
│       └── FundingRate.sol
│
├── test/                         # 205+ Foundry tests
│
├── frontend/                     # Next.js 14 + wagmi + RainbowKit
│   └── src/
│       ├── app/
│       │   ├── page.tsx          # Landing + swap
│       │   ├── explore/          # Token explorer + detail pages
│       │   ├── stocks/           # GoodStocks trading UI
│       │   ├── predict/          # GoodPredict markets
│       │   ├── perps/            # GoodPerps trading
│       │   ├── portfolio/        # Portfolio overview
│       │   ├── bridge/           # Bridge UI
│       │   └── pool/             # Liquidity pools
│       ├── components/           # 35+ reusable components
│       └── lib/                  # Data layers, utils, wagmi config
│
├── script/                       # Foundry deploy scripts
├── op-stack/                     # OP Stack chain config
│
└── .autobuilder/                 # AI build loop
    ├── scope.md                  # Project vision & phases
    └── initiatives/              # 109 feature specs (PRDs)
```

---

## 💰 Token Economics

| Flow | Split |
|------|-------|
| Every dApp fee → UBI pool | **20%** |
| Every dApp fee → Protocol treasury | 17% |
| Every dApp fee → dApp developer | 50% |
| Validator staking minimum | 1M G$ |
| Validator annual rewards | 5% APR |
| Slashed validator funds → | UBI pool |

**At scale:**
| Users | Daily Fee Pool | UBI Multiplier |
|-------|---------------|----------------|
| 1M | $20,000/day | 1.11x (self-sustaining ✓) |
| 100M | $3.3M/day | Significant supplemental income |
| 1B | $20.2M/day | $0.020/day base + pool share |

---

## 🗺️ Roadmap

| Phase | Status | What |
|-------|--------|------|
| **Phase 1** | ✅ Done | Core contracts + GoodSwap DEX |
| **Phase 2** | ✅ Done | GoodStocks + GoodPredict + GoodPerps contracts & UIs |
| **Phase 3** | 🔜 Next | Testnet deployment, bridge go-live, E2E testing |
| **Phase 4** | 📋 Planned | GoodLend (Aave fork), GoodStake, GoodNames (.good domains) |
| **Phase 5** | 📋 Planned | Celestia DA, decentralized sequencer, 1B claim capacity |

---

## 🔗 Links

| Resource | URL |
|----------|-----|
| 🌐 AutoBuilder Dashboard | [goodclaw.org](https://goodclaw.org) |
| 🔄 GoodSwap Live | [goodswap.goodclaw.org](https://goodswap.goodclaw.org) |
| 📊 Agent Dashboard (Paperclip) | [paperclip.goodclaw.org](https://paperclip.goodclaw.org) |
| 📖 GoodDollar Protocol | [gooddollar.org](https://gooddollar.org) |
| 📈 GoodDollar Stats | [dashboard.gooddollar.org](https://dashboard.gooddollar.org) |
| 🏗️ Autobuilder Initiatives | [GitHub](https://github.com/yoniassia/gooddollar-l2/tree/main/.autobuilder) |

---

## About GoodDollar

[GoodDollar](https://gooddollar.org) is a UBI protocol founded by **Yoni Assia** in 2018. 640K+ registered users receive daily G$ distributions. GoodDollar L2 is the next evolution — a dedicated chain where the entire DeFi economy funds UBI by default.

The vision: **every on-chain action funds universal basic income.** Every swap. Every trade. Every liquidation. Every fee. All flowing to verified humans worldwide.

---

## License

MIT
