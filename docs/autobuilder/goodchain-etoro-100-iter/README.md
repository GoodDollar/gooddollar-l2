# GoodChain / eToro Synthetic Stocks — SpecKit + Delivery Status

<!-- GOODCHAIN_STATUS:START -->
> **Public testnet checkpoint (2026-05-24 16:47 UTC):** `main@6e329ad3` is deployed to `goodswap.goodclaw.org`. Public health gate and lane-7 internal smoke are **GREEN-with-warnings** with `0` blockers. Explorer/RPC were repaired without wiping Blockscout DB; final verification showed RPC/explorer at block `13777`, and a live follow-up probe saw the explorer advancing past `14029`. Remaining warnings are accepted/excluded health-only services or optional `LANE7_RPC` freshness config. See root `README.md` and `docs/ARCHITECTURE.md`.
<!-- GOODCHAIN_STATUS:END -->


This folder is the SpecKit planning and delivery package for connecting eToro-style real-world equity exposure to GoodChain synthetic stocks, perps, lending/yield, risk, frontend/admin tooling, and UBI fee routing.

## Executive Status — 2026-05-21 19:40 UTC

**Overall:** implementation is moving, runtime is healthy, and the previous “stuck iteration” symptom was isolated to long-running Cursor lane subprocesses that had already produced commits but did not exit cleanly.

- **Public runtime:** GoodSwap `/api/status` reported `12/12` services healthy.
- **Local chain:** alive and advancing; checked at block `0x664c` before restart.
- **Main testnet-readiness builder:** not stuck; completed cleanly at the 43/43 safety cap earlier and is now only monitored.
- **Four parallel Cursor lanes:** restarted at `2026-05-21T19:38Z` after they appeared hung for >1h with parent loops idle.
- **Commit volume today:** 135 commits across all GoodDollar L2 worktree refs; 12 commits since the 18:20 UTC Cursor relaunch before the restart.
- **Current branch package:** this commit captures the local integration/runtime hardening, tests, docs, trading-bot artifact, and delivery status. The parallel lane branches remain separate worktrees and should be merged through the normal integration pass.

## What Was Delivered / Coded Today

### 1. Synthetic stocks UX and resilience

Parallel lane work delivered major GoodStocks UI and error-handling upgrades, including:

- Stale-data banners and watchlist error boundaries.
- Portfolio data-fetch error surfacing instead of silent empty states.
- Better quote-status and degraded-mode presentation.
- Market session context for US market hours.
- Stock stats bar on detail pages.
- Trade price-impact preview with slippage and total-cost display.
- Advanced trading UI: order book, recent trades, improved chart context, TP/SL and stop-limit options, and account/margin panels.
- Portfolio analytics: P&L chart, allocation donut, performance stats, and enriched trade history.

Representative worktree commits since the latest 18:20 UTC run:

- Lane A:
  - `09067653` — stale-data banner and watchlist error boundary.
  - `49229cc1` — portfolio data-fetch errors visible.
- Lane B:
  - `824680bb` — resolved 63 TypeScript strict-mode errors in 10 test files.
- Lane C:
  - `f05092dc` — trade price-impact preview.
  - `9d64a30e` — market-session badge.
  - `b73fa357` — stock stats bar.
  - `e7c86a37` — oracle references and UBI fee updated from 20% to 33%.
  - `fabf1f0d` — E2E networkidle timeout fix marked executed.
- Lane D:
  - `f0dd3cd5` — ClearingHouse fuzz + invariant tests.
  - `fd770789` — StockPerpEngine fuzz + invariant tests.
  - `34e7ac2c` — Foundry fuzz/invariant configuration and coverage limitation docs.

### 2. Runtime / PM2 / address hardening

This package includes local integration hardening in `backend/ecosystem.config.js` and its tests:

- The PM2 ecosystem now includes GoodSwap and oracle-signer coverage in the config test surface.
- Address loading now prefers canonical generated deployment artifacts (`op-stack/addresses.json` and `.autobuilder/addresses.env`) before stale parent-process environment values.
- Service fallbacks were aligned to the current local GoodDollar L2 deployment.
- `backend/ecosystem.config.test.js` now validates against `op-stack/addresses.json` dynamically rather than hard-coded stale addresses.
- The ecosystem test now passes after the address-sync changes.

### 3. Transaction-noise throttling

Yoni flagged that a job looked like it was making transactions too often.

Investigation found:

- `815` admin/dev transactions counted on the local chain through block `17394`.
- `522` targeted `StockOracleV2`; `502` reverted and `20` succeeded.
- The noisy cadence came primarily from keeper-style PM2 processes running on a 60s interval.

Changed:

- `stocks-keeper` `UPDATE_INTERVAL_MS` now defaults to `900000` ms / 15 minutes.
- `swap-oracle` `UPDATE_INTERVAL_MS` now defaults to `900000` ms / 15 minutes.
- Both PM2 processes were restarted with updated env.
- Logs confirmed the new 15-minute cadence; a 95-second post-restart watch showed no repeat 60-second cycle.

Remaining note: `StockOracleV2` can still emit a reverted batch update once per cycle. That is now throttled to ~15 minutes, but the underlying V2 batch rejection should still be fixed/disabled in a follow-up.

### 4. Testing and build-script cleanup

The local package also includes test and tooling updates:

- Backend package test commands were normalized where needed:
  - `bridge-keeper` / `liquidator`: tolerate empty Jest suites with `--passWithNoTests`.
  - `monitor`: uses Node’s test runner with `ts-node/register`.
  - `predict`: uses deterministic `vitest run`.
- Frontend API route tests were updated for current runtime expectations.
- Wallet/EIP-155/address-guard tests were adjusted to reduce false negatives.
- PM2 postbuild reload script and tests were hardened.
- `.gitignore` now excludes accidental TypeScript artifacts emitted beside shared quote types.

### 5. Activity generator / trading bot artifact

A `backend/trading-bot/` package was added as a devnet activity generator for exercising on-chain apps:

- Cycles through swap, perps, lend, and price reads.
- Uses the standard Anvil-funded dev account only.
- Produces transaction logs that can be used for indexer, explorer, and revenue/health validation.

This is a devnet/testnet helper, not a production trading service.

### 6. Price rebalance documentation

Added a price-rebalance design package:

- `PRICE_REBALANCE_DESIGN.md`
- `price-rebalance-diagram.png`

This documents the desired path from stock price freshness and rebalance decisions to risk controls, keeper cadence, and UI status surfacing.

## Lane Restart — 2026-05-21T19:38Z

The stuck Cursor lane processes were terminated and restarted.

Relaunched lanes:

| Lane | Project ID | Worktree | Port | Status |
|---|---|---|---:|---|
| A | `gooddollar-l2-cursor-a` | `cursor-lane-a-20260520-4x25` | 3211 | restarted |
| B | `gooddollar-l2-cursor-b` | `cursor-lane-b-20260520-4x25` | 3212 | restarted |
| C | `gooddollar-l2-cursor-c` | `cursor-lane-c-20260520-4x25` | 3213 | restarted |
| D | `gooddollar-l2-cursor-d` | `cursor-lane-d-20260520-4x25` | 3214 | restarted |

Restart logs are under:

```text
/home/goodclaw/goodchain-overnight/logs/restart-gooddollar-l2-cursor-*-20260521T193842Z.log
```

Important: lanes are intentionally launched with `--no-push`; their commits stay in their worktree branches until the integration pass.

## Verification Snapshot

Checks run during this update:

```text
node backend/ecosystem.config.test.js
# ALL TESTS PASSED
```

Runtime checks before restart:

```text
GoodSwap /api/status: overall healthy, 12/12 services
PM2: GoodDollar L2 services online
Chain: eth_blockNumber returned 0x664c
```

Post-restart process check showed exactly one builder daemon per lane after removing foreground launcher leftovers.

## Known Gaps / Next Actions

1. **Merge lane worktrees intentionally.** Today’s lane commits are real and clean in their own branches, but not yet integrated into the current branch.
2. **Fix StockOracleV2 batch rejection.** The 15-minute throttle reduced noise, but the V2 batch update should stop reverting.
3. **Run a full integrated gate after merging lanes.** Suggested gate: backend tests, Foundry fuzz/invariants, frontend lint/build, and Playwright smoke against `goodswap.goodclaw.org`.
4. **Confirm eToro sandbox auth/live endpoint.** Still a prerequisite before real market-data smoke tests.
5. **Add timeout/cleanup to Cursor lane loops.** The restart fixed the immediate hang, but the loop should kill child Cursor/Next dev subprocesses if an iteration exceeds a hard timeout.

## Artifact Index

1. [Constitution](CONSTITUTION.md)
2. [Spec](spec.md)
3. [Plan](plan.md)
4. [Tasks](tasks.md)
5. [Risk Register](RISK_REGISTER.md)
6. [Gates](GATES.md)
7. [Manifest](MANIFEST.md)
8. [Price Rebalance Design](PRICE_REBALANCE_DESIGN.md)
9. [Price Rebalance Diagram](price-rebalance-diagram.png)

## Current Classification

**Testnet-ready infrastructure is healthy, but the eToro synthetic-stocks workstream is still pre-production.** The strongest progress today is in frontend trading UX, security/invariant coverage, runtime address hygiene, and operational cadence control. The next decisive step is merging the parallel lane branches and running the integrated release gate.
