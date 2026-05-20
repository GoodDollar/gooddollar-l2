# Runbook — Pool reserves are misconfigured (frontend guard + on-chain remediation)

> Tracking: [`0024-fix-pool-page-broken-display`](../../.autobuilder/initiatives/0006-etoro-synthetic-stocks-100/tasks/0024-fix-pool-page-broken-display.md)
>
> Touches (read-only from lane-c's perspective):
> [`frontend/src/lib/useGoodPool.ts`](../../frontend/src/lib/useGoodPool.ts)
> · [`frontend/src/app/(app)/pool/page.tsx`](../../frontend/src/app/(app)/pool/page.tsx)
> · `src/SwapPool.sol` (the on-chain pool — **NOT** modified by this lane)

This runbook documents what to do when one or more GoodDollar L2 swap pools are
flagged as **`MISCONFIGURED`** in the UI. The frontend defends against the
broken state on its own; this runbook is the handoff to the operator who holds
the on-chain seed / owner key and can actually fix the reserves.

---

## TL;DR

| Situation | Who acts | Action |
| --- | --- | --- |
| `/pool` shows a red **MISCONFIGURED** badge on a pool card | Anyone | No on-chain action needed. Trading on that pool is auto-disabled by the frontend guard. |
| You need to confirm the on-chain state | Anyone with RPC access | `cast call <poolAddress> "reserveA()(uint256)" --rpc-url $RPC` (and `reserveB`). See [Detection](#detection) below. |
| You need to re-seed a misconfigured pool | **Ops / multisig** (not this lane) | Owner-only on-chain transaction. See [Remediation](#remediation) — this lane does **not** execute it. |

---

## Symptoms

On `https://goodswap.goodclaw.org/pool` (or local `:3123/pool`):

- Each affected pool card shows a red **`MISCONFIGURED`** badge in the header.
- Reserve rows show `—` instead of a number.
- The "Price" / spot-price row shows `—`.
- The Manage / Deposit / Withdraw buttons on that card are visibly disabled.
- A red banner at the top of the page reads:

  > ⚠️ One or more pools are misconfigured. On-chain reserves imply an
  > out-of-range spot price. Trading is disabled until reserves are reseeded.
  > See the pool runbook for recovery steps.

The same on-chain reserves are also read by `/swap` quote paths and by the
Stocks / Yield analytics surfaces. A follow-up task plumbs the same guard
through those surfaces; until then, treat any astronomical number on those
pages as a downstream symptom of the same root cause.

---

## Root cause (known)

The frontend math in `frontend/src/lib/useGoodPool.ts` is **correct**:
`formatPoolAmount` passes each token's decimals to `viem`'s `formatUnits`, and
`computeSpotPrice` is a plain `reserveB / reserveA` over already-decimal-aware
values.

The misconfigured state therefore lives **on-chain**: the pool was seeded with
mismatched scales — typically the same numeric seed amount applied to two
tokens that have different `decimals()` (G$ and WETH have 18, USDC has 6).
Working backwards from the iter-1 observation:

- G$/USDC observed: `reserveA ≈ 1e-6 G$` (dust) and `reserveB ≈ 1e18 USDC`
  (absurd). Consistent with a seed script that scaled both reserves with 18-
  decimal precision but applied them as if USDC also had 18 decimals.

---

## How the frontend guard classifies a pool

`classifyPoolHealth(reserveAFormatted, reserveBFormatted)` in
`frontend/src/lib/useGoodPool.ts` returns one of:

- **`'unknown'`** — at least one reserve is `undefined`, `NaN`, non-finite, or
  ≤ 0. This is the loading state and also covers the genuinely-empty pool
  case. The card renders in its existing loading style; trading is **not**
  disabled.
- **`'ok'`** — both reserves are finite, positive, and the implied spot price
  `b / a` falls in `[1e-9, 1e3]`. The card renders normally.
- **`'misconfigured'`** — both reserves are finite and positive, but the
  implied spot price `b / a` is outside `[1e-9, 1e3]`. The card renders with
  the badge, `—` values, and disabled actions.

The band is intentionally loose. We only flag pools whose price is off by many
orders of magnitude — never a price that is merely "expensive" or "cheap".

---

## Detection

Two ways:

1. **From the UI**: visit `/pool` and look for the red badge. This is the
   canonical user-visible signal.

2. **From the chain directly** (use this when reproducing or filing a
   remediation ticket):

   ```bash
   # G$/USDC pool address comes from frontend/src/lib/chain.ts /
   # devnet.ts CONTRACTS.SwapPoolGdUsdc.
   POOL=0x...   # SwapPoolGdUsdc | SwapPoolGdWeth | SwapPoolWethUsdc
   RPC=https://devnet.goodclaw.org   # or your local anvil

   cast call $POOL "reserveA()(uint256)" --rpc-url $RPC
   cast call $POOL "reserveB()(uint256)" --rpc-url $RPC

   # Decimals are baked into the frontend pool metadata:
   #   G$/WETH   : tokenA=G$  (18) , tokenB=WETH (18)
   #   G$/USDC   : tokenA=G$  (18) , tokenB=USDC (6)
   #   WETH/USDC : tokenA=WETH(18) , tokenB=USDC (6)
   ```

   Then translate to a human-scale spot price:

   `spot = (reserveB / 10**decB) / (reserveA / 10**decA)`

   A spot price outside `[1e-9, 1e3]` matches the frontend classifier.

---

## Known-bad snapshot (iter #1, testnet)

Captured from `/tmp/review-iter1-c-fresh/page-pool.png`:

| Pool | `reserveAFormatted` | `reserveBFormatted` | Displayed price (B per 1 A) | Verdict |
|---|---|---|---|---|
| G$/WETH   | `1,000`        | `3,000,000`   | `3,000`         | misconfigured |
| G$/USDC   | `0.000001`     | `1e18`        | `~1e24`         | misconfigured |
| WETH/USDC | `0.000003`     | `1e18`        | `~3.3e17`       | misconfigured |

(`1e18` USDC ≡ `1e24` raw units against 6-decimal USDC — the dead giveaway
of an 18-decimal scale applied to a 6-decimal token.)

---

## Expected seed amounts

These are sane testnet seeds that would land each pool in the `'ok'` band.
They are **suggestions for the operator**, not commitments — pick whatever
matches your testnet liquidity policy, as long as the spot price stays in
`[1e-9, 1e3]`.

| Pool | tokenA seed | tokenB seed | Implied spot (B per 1 A) | Notes |
|---|---|---|---|---|
| G$/WETH   | `1,000 G$`        | `1 WETH`       | `0.001 WETH / G$`   | ~$2 per G$ if WETH ≈ $2000 |
| G$/USDC   | `1,000 G$`        | `100 USDC`     | `0.1 USDC / G$`     | matches G$ documented mint reference |
| WETH/USDC | `1 WETH`          | `2,000 USDC`   | `2,000 USDC / WETH` | mainnet-ish ratio |

The exact seed call lives in the swap-pool deployment / seed script under
`script/` (out of scope for this lane to enumerate). Operators should consult
the pool's `deposit` / initial-seed entry point and pass amounts in **raw
base units**, not decimal strings, to avoid the original failure mode.

---

## Remediation

> ⚠️ **Lane-c boundary.** This runbook is the handoff. The fix is an on-chain
> owner action. **This lane does not execute the fix** and does not hold the
> seed/owner key. The frontend guard is the only mitigation this lane ships.

Operator steps (informational — execute outside this lane):

1. **Confirm** the bad state via the [Detection](#detection) `cast` calls
   above. Save the raw `reserveA` / `reserveB` values for the audit trail.
2. **Drain or burn** the existing bad LP supply through the pool's owner-only
   path, if such a path exists, or accept the existing supply as the new
   baseline.
3. **Re-seed** with sane raw amounts per the table in
   [Expected seed amounts](#expected-seed-amounts) (use base units!).
4. **Verify** by re-running the `cast` calls and reloading `/pool`. The
   `MISCONFIGURED` badge should disappear. If any card still shows the badge,
   the implied spot is still outside `[1e-9, 1e3]` — re-check token decimals
   on the seed call.
5. **Spot-check** `/swap` and Stocks / Yield surfaces for any leftover
   astronomical numbers (those surfaces are guarded in a follow-up task).

---

## Lane-c invariants this runbook respects

- No production Solidity is modified.
- No on-chain transactions are sent from this lane.
- The frontend guard is purely additive — healthy pools continue to render
  unchanged the moment their reserves return to the `[1e-9, 1e3]` spot-price
  band.
- The classification rule lives in a pure helper (`classifyPoolHealth`) with
  unit-test coverage, so the guard cannot silently regress.
