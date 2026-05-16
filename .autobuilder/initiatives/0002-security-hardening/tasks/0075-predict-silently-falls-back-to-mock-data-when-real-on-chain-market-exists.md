---
id: gooddollar-l2-predict-implied-probability-bps-scaling-bug
title: "Predict — yesPrice Wrongly Divides BPS by 1e18, Renders Every Market as YES 0¢ / NO 100¢ (CRITICAL Data Integrity)"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [frontend, predict, data-integrity, critical, bug, error-handling]
---

# Predict — yesPrice Wrongly Divides BPS by 1e18, Renders Every Market as YES 0¢ / NO 100¢ (CRITICAL Data Integrity)

> **Note**: This task is outside the formal Phase 1 security-hardening scope
> but is filed per the product-review skill's "CRITICAL exception" (data
> integrity / contradictory UI) clause. The Predict UI displays a
> mathematically impossible "0% YES / 100% NO" implied probability for
> EVERY on-chain market regardless of its real liquidity. This makes the
> entire Predict surface look like every market has been resolved NO.
>
> **History**: an earlier draft of this task incorrectly claimed that
> `/predict/0` rendered "Market Not Found" and the listing showed only
> hardcoded mock markets. Re-verification against
> `https://goodswap.goodclaw.org/predict` and `/predict/0` proved both
> pages DO read on-chain market 0 ("Will BTC hit $100K by 2026?"). The
> real bug, found while inspecting why the on-chain market displayed
> "YES 0¢ / NO 100¢" alongside its correct question, is a units mismatch
> between the contract and the frontend.

## Problem statement

`MarketFactory.impliedProbabilityYES(uint256)` returns the YES probability
in **basis points (BPS, 10000 = 100%)**:

```solidity
// src/predict/MarketFactory.sol:309
// @notice Implied probability of YES winning, in BPS (5000 = 50%)
function impliedProbabilityYES(uint256 marketId) external view returns (uint256) {
    Market storage m = markets[marketId];
    uint256 total = m.totalYES + m.totalNO;
    if (total == 0) return 5000; // 50% when no bets yet
    return (m.totalYES * BPS) / total;
}
```

But `frontend/src/lib/useMarkets.ts` treats the return value as a
**1e18-scaled** fixed-point number:

```ts
// frontend/src/lib/useMarkets.ts:101 (useOnChainMarket)
const yesPrice = Number(probRaw) / 1e18

// frontend/src/lib/useMarkets.ts:166 (useAllOnChainMarkets)
const yesPrice = probRaw ? Number(probRaw) / 1e18 : 0.5
```

The header comment on line 10 also documents the same wrong assumption:
`* - useImpliedProbability(marketId): YES probability (1e18-scaled)`.

For an un-traded market the contract returns `5000`. The frontend computes
`5000 / 1e18 = 5e-15`, which `Math.round(... * 100)` renders as **0**.
Every on-chain Predict market therefore displays as **"YES 0¢ / NO 100¢"**
and **"0% chance"** regardless of its real liquidity or implied probability.

### Live evidence (verified against https://goodswap.goodclaw.org)

```bash
# /predict (listing) — on-chain market is read and shown:
$ agent-browser open https://goodswap.goodclaw.org/predict
# Featured card:
#   "Will BTC hit $100K by 2026?"   (✓ on-chain question)
#   0% chance                         (✗ should be 50%)
#   Yes 0¢                            (✗ should be 50¢)
#   No 100¢                           (✗ should be 50¢)

# /predict/0 (detail) — on-chain market is read and shown:
$ agent-browser open https://goodswap.goodclaw.org/predict/0
# Heading: "Will BTC hit $100K by 2026?"  (✓ on-chain question)
# Trade panel buttons:
#   YES 0¢   (✗ should be 50¢)
#   NO 100¢  (✗ should be 50¢)

# Contract-side reality from the SAME public RPC the frontend uses:
$ cast call 0xfaA7b3a4b5c3f54a934a2e33D34C7bC099f96CCE \
    "impliedProbabilityYES(uint256)(uint256)" 0 \
    --rpc-url https://rpc.goodclaw.org
5000  # i.e. 50.00% in BPS
```

So contract returns `5000` (50.00% in BPS), frontend renders `0%`.

### What the user sees

1. Browse `/predict`. Every card shows "Yes 0¢ / No 100¢" and "0% chance".
2. It looks like every market has already resolved NO, or that nobody
   believes YES on anything.
3. Click any card. The detail page also shows "YES 0¢ / NO 100¢".
4. Try to place a trade. The "Avg Price" line in the trade panel computes
   `price = yesPrice ≈ 0`, so the shares calculation
   `parseFloat(amount) / price` divides by ~zero and produces
   astronomical "Est. Shares" and "Potential Payout" values
   (typically `Infinity` once `amount` is non-zero, then formatted by
   `formatShares` as `Infinity` or a 30-digit number).
5. The Probability chart (`generateProbabilityHistory(market.yesPrice, 90)`)
   also receives `yesPrice ≈ 0` and draws a flat line at 0%, reinforcing
   the false story.

This is data corruption visible to every user of the Predict feature.

## Why this is CRITICAL (data integrity)

1. **The frontend is lying about implied probability.** The contract has
   one truth (50% for un-traded markets, well-defined post-trade); the UI
   shows a contradictory truth (0% always). This is the same class of bug
   as "wrong account balance" or "wrong order price".
2. **It breaks the trading math.** A user who tries to buy YES at the
   displayed `0¢` price sees nonsensical share counts and payouts, then
   the actual on-chain swap either reverts or executes against a real
   AMM price that has nothing to do with what was displayed. There is no
   slippage protection in the UI to catch this.
3. **It misrepresents the protocol.** Every market looks dead-NO. A user
   reading the marketing copy ("real prediction markets, every trade
   funds UBI") and seeing a uniform 0%/100% wall would conclude the
   protocol is broken or that NO bets always win.
4. **The bug is invisible to monitoring** — there is no error, no
   console warning, no failed request. Wagmi's `useReadContract` returns
   a successful `5000n`. The conversion math is just wrong.

## Root cause

`useMarkets.ts` was written assuming `impliedProbabilityYES` returned a
1e18-scaled fixed-point number (matching the convention used by, e.g.,
`ERC20.decimals = 18`). It does not — `MarketFactory.sol` uses BPS
(`BPS = 10000`, defined alongside `FEE_BPS` and `UBI_BPS` in the
contract). No test ever asserted the UI's conversion produced the
expected float, so the mismatch survived.

## Files involved

- `frontend/src/lib/useMarkets.ts`
  - **Line 10** (jsdoc): `* - useImpliedProbability(marketId): YES probability (1e18-scaled)` — wrong, should say "in BPS (10000 = 100%)".
  - **Line 101** (`useOnChainMarket`): `const yesPrice = Number(probRaw) / 1e18` — must divide by `10_000` (or `BPS`).
  - **Line 166** (`useAllOnChainMarkets`): `const yesPrice = probRaw ? Number(probRaw) / 1e18 : 0.5` — same fix.

- `src/predict/MarketFactory.sol` line 312 — contract is correct; constant `BPS` is the source of truth.

- `frontend/src/lib/predictData.ts` — `PredictionMarket.yesPrice` is documented as a 0–1 float, which matches what the frontend wants; the issue is purely the conversion.

- `frontend/src/app/(app)/predict/[marketId]/page.tsx` — `TradePanel` computes `price = side === 'yes' ? market.yesPrice : 1 - market.yesPrice`, then `shares = amount && price > 0 ? parseFloat(amount) / price : 0`. Currently `price = 0` for YES, so the guard `price > 0` saves us from `Infinity` in the YES case — but NO side reports `price = 1`, hiding the bug from one side. The unit-conversion fix removes the asymmetry entirely.

## Acceptance criteria

1. **`yesPrice` is a true 0–1 float matching `impliedProbabilityYES / 10000`.**
   For market 0 in its current state (`totalYES=0, totalNO=0`), the UI
   must display **"50% chance"** and **"YES 50¢ / NO 50¢"** on both
   `/predict` (featured + grid) and `/predict/0` (detail).

2. **The fix is centralised.** Introduce a `BPS_DECIMALS = 10_000` constant
   (or import `BPS` from a shared `constants.ts`) used everywhere
   `impliedProbabilityYES` results are consumed. No magic `/ 1e18` or
   `/ 10000` literals left in `useMarkets.ts`.

3. **Update the jsdoc** on line 10 of `useMarkets.ts` to describe the
   actual unit: "YES probability in BPS (10000 = 100%)".

4. **Vitest unit test:** add a test in `frontend/src/lib/__tests__/useMarkets.test.ts`
   (or extend an existing test file) that:
   - Feeds the parser the tuple
     `["Will BTC hit $100K by 2026?", 1778981904n, 0, 0n, 0n, 0n]`
     and the probability `5000n`.
   - Asserts the returned `OnChainMarket.yesPrice === 0.5` (within `1e-9`).
   - Also tests `2500n` → `0.25`, `7500n` → `0.75`, and the edge
     `10000n` → `1.0`.

5. **Snapshot/integration test for the listing**: render `/predict` with
   wagmi mocked to return market 0 + `prob=5000n` and assert the rendered
   text contains "50%", "50¢" (not "0%", "0¢").

6. **No regression in fallback path**: when `probRaw` is undefined (still
   loading or RPC failed), `yesPrice` still defaults to `0.5` (current
   behaviour on `useAllOnChainMarkets` line 166), not to `0`. The
   `useOnChainMarket` path (line 101) currently does NOT default to 0.5
   when probRaw is undefined — fix this too to keep both code paths
   consistent.

7. **Foundry regression test** (defensive): add a test in
   `test/predict/` that asserts `factory.impliedProbabilityYES(...)` for a
   freshly created market with zero liquidity returns exactly `5000`, so
   any future refactor of the contract that changes the unit will fail
   the test and force the frontend to be updated too.

8. **README update** per spec: bump commit count, add line to "Security
   Hardening" section ("Fixed implied-probability units mismatch — Predict
   UI now matches contract BPS scaling"), update `Updated:` date.

## Non-goals

- Do not redesign the Predict trade panel UI.
- Do not change the contract's units (changing BPS → 1e18 would force a
  redeploy and break test assertions on lines 283 and 292 of
  `test/predict/GoodPredict.t.sol`).
- Do not address the unrelated "featured hero shows mock badge / TRENDING
  even with zero volume" issue (already covered by task 0074).
- Do not address the empty-grid-when-only-featured issue (task 0072).

## Planning

### Overview

Pure units bug. Two lines in `useMarkets.ts` to change, plus a jsdoc
comment, plus tests. Estimated total effort: under an hour for the fix
itself; the unit-test scaffolding may take longer if no Vitest config
exists for `lib/`.

### Research notes

- `MarketFactory.sol` lines 27, 309–314 confirm BPS = 10000.
- `test/predict/GoodPredict.t.sol` lines 283, 292 already test the BPS
  contract — `assertEq(factory.impliedProbabilityYES(marketId), 5000)`
  and `7500`. These tests guard the contract; the frontend has no
  matching guard, which is how the units drift slipped in.
- `frontend/package.json` should be inspected for a test runner. If
  Vitest isn't already set up, we'll prefer a minimal Node `tsx` test
  harness to avoid adding dependencies; otherwise extend the existing
  test suite.
- The 50% default for un-traded markets is the current contract
  behaviour. The UI should mirror this exactly.

### Assumptions

- `BPS = 10000` is stable across the contract (no plans to change it
  in Phase 1; any change would itself be a contract bug).
- Both `useReadContract` and `useReadContracts` already return the BPS
  value as a `bigint`. The viem repro in iteration #35 confirmed this
  (`prob: 5000n`).
- React/Wagmi rerender cycle correctly propagates the fix — no caching
  layer to invalidate.

### Architecture

```text
[ MarketFactory.sol ]
   impliedProbabilityYES(id) → uint256 in BPS (5000 = 50%)
        │
        ▼
[ frontend/src/lib/useMarkets.ts ]
   probRaw: bigint
        │
        ▼
   yesPrice = Number(probRaw) / BPS_DECIMALS   ← FIX HERE
        │
        ▼
[ OnChainMarket.yesPrice ∈ [0, 1] ]
        │
        ▼
[ PredictionMarket.yesPrice (predictData.ts) ]
        │
        ▼
[ /predict listing & /predict/[marketId] ]
   Math.round(yesPrice * 100) → "50%"
   yesPrice * 100  → "50¢"
   1 - yesPrice    → "NO 50¢"
```

### One-week decision

Yes — this fits comfortably in less than a day. No splits required.

### Implementation plan

1. **Add constant.** In `frontend/src/lib/useMarkets.ts`, add at top of
   file (or import from a new `frontend/src/lib/constants.ts`):
   ```ts
   /** BPS denominator used by MarketFactory.impliedProbabilityYES (10000 = 100%). */
   const BPS_DENOMINATOR = 10_000
   ```

2. **Fix `useOnChainMarket` line 101.** Replace `Number(probRaw) / 1e18`
   with `Number(probRaw) / BPS_DENOMINATOR`. Also add a `?? 0.5`
   default so probRaw=undefined → 0.5 (matching the
   `useAllOnChainMarkets` behaviour).

3. **Fix `useAllOnChainMarkets` line 166.** Replace
   `probRaw ? Number(probRaw) / 1e18 : 0.5` with
   `probRaw !== undefined ? Number(probRaw) / BPS_DENOMINATOR : 0.5`.

4. **Update jsdoc on line 10** of `useMarkets.ts`:
   `* - useImpliedProbability(marketId): YES probability in BPS (10000 = 100%)`.

5. **Vitest unit test.** Create
   `frontend/src/lib/__tests__/useMarkets-bps.test.ts` (or extend the
   nearest existing file) with the cases in Acceptance #4.

6. **Listing snapshot test.** Extend the existing predict-page test
   (if any) or add a minimal render assertion that mocks wagmi via
   `vi.mock('wagmi', ...)` to return `{ data: ["...", 1778981904n, 0,
   0n, 0n, 0n] }` and `{ data: 5000n }`, mounts the listing, and
   asserts visible text.

7. **Foundry regression** (Acceptance #7): the existing
   `test/predict/GoodPredict.t.sol` line 283 already covers
   `impliedProbabilityYES = 5000` for the zero-liquidity case — verify
   it still passes, and add an explicit comment linking it to this
   frontend invariant so it isn't accidentally weakened in a future
   refactor.

8. **README update** per Acceptance #8.

9. **react-doctor** before commit (per build-loop rules), target
   score 75+, do not commit below 50.

### Risk / rollback

- **Risk**: low — pure number-conversion change in two lines.
- **Compatibility**: no other code reads `probRaw` directly, so no
  downstream callers need updating.
- **Rollback**: revert the single commit; no data migration needed.

### README update (mandatory per spec)

After execution:
- Bump commit count.
- Add to "Security Hardening" section: "Fixed Predict UI implied-probability
  units bug — frontend was dividing contract BPS by 1e18, displaying every
  market as 0% chance / Yes 0¢ / No 100¢."
- Update the `Updated:` date.
