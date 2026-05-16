---
id: gooddollar-l2-swap-deadline-bypass
title: "Swap — Wire User-Configured Deadline Through to On-Chain swapExactTokensForTokens (MEV protection)"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [frontend, security, mev, swap, deadline]
---

# Swap — Wire User-Configured Deadline Through to On-Chain swapExactTokensForTokens (MEV protection)

> Note: this task is a frontend change, but it is filed inside the
> security-hardening initiative because it closes a real MEV / time-bandit
> vector in the live swap path. The Non-Goals section of the initiative
> spec explicitly allows frontend changes when they fix a security issue.

## Problem

`useOnChainSwap.ts` hardcodes the on-chain `deadline` parameter passed to
`GoodSwapRouter.swapExactTokensForTokens(...)` to **20 minutes from now**,
no matter what the user picked in the Advanced → Settings drawer.

The user-facing UI looks like the deadline is configurable: `SwapSettings.tsx`
renders a "Transaction deadline (minutes)" input that is clamped between
1 and 180 minutes by `useSwapSettings.ts` (see `setDeadline`), persists the
choice to `localStorage` under `gooddollar:swap-prefs:v1`, and shows the
selected value back in the panel. Power users and MEV-aware traders rely
on a short deadline (e.g. 1-3 minutes) so a stale signed transaction
cannot be re-broadcast at a worse price by a private mempool searcher.

But the on-chain call ignores all of that:

```ts
// frontend/src/lib/useOnChainSwap.ts:120-121
// 20-minute deadline
const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)
```

Then on line 137 that hardcoded `deadline` is what gets baked into the
signed transaction's calldata:

```ts
args: [amountInWei, amountOutMin, [tokenIn.address, tokenOut.address], address, deadline],
```

So a user who explicitly chose **1 minute** to defend against a stale-quote
sandwich silently gets a **20-minute** deadline. That is a textbook
"UI lies about a security control" bug.

### Why this is a security issue, not just UX

1. **MEV / time-bandit risk.** A pending tx with a long deadline can be
   held in a private mempool until prices move against the user, then
   landed in a block where the trade is still inside the user's slippage
   tolerance but materially worse than the quote they signed for.
   Shortening the deadline is the standard, well-understood mitigation,
   and the UI already exposes it.
2. **Trust calibration.** The Settings panel currently presents the
   deadline as an active setting. A user who reads the docs ("set a low
   deadline for MEV protection") and dials it down to 1 min will believe
   they are protected. They are not. That false sense of security is
   itself a security failure.
3. **Audit-prep gap.** Per the initiative spec we are heading into a
   Trail of Bits / OpenZeppelin scope for swap and bridge contracts in
   Phase 4. Any auditor will flag a UI control that has zero on-chain
   effect as a finding.

### What the call path looks like today

```
SwapSettings.tsx
  ↳ setDeadline(min)  ──►  useSwapSettings.ts (preferences.settings.deadline, 1-180)
                                                │
                                  localStorage  │ persists, but
                                                ▼
SwapCard.tsx ◄─── const { slippage } = useSwapSettings()   ◄── reads slippage only
                  // deadline is NEVER read here

  ↳ <SwapWalletActions ... onChainAmountOutMin=... />
                  // deadline NOT passed in props

SwapWalletActions.tsx
  ↳ swap(symbolIn, symbolOut, amountIn, amountOutMin)
                  // deadline NOT in this signature

useOnChainSwap.ts::useSwapExecute().swap(...)
  ↳ const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)
                  // ← hardcoded 20 min, ignores user setting
  ↳ writeContractAsync({
      ...
      args: [amountInWei, amountOutMin, [tokenIn, tokenOut], address, deadline],
    })
```

The hook layer is the only place that knows about the deadline, but it
cannot reach `useSwapSettings`'s state because `useSwapExecute` is
called from `SwapWalletActions` and never receives the user's chosen
value.

## Scope

### 1. Plumb the user's deadline minutes from `useSwapSettings` to `useSwapExecute`

Two acceptable shapes — pick whichever is cleaner during planning:

**Shape A (preferred): hook reads the setting itself.**

`useSwapExecute` calls `useSwapSettings()` internally and computes the
deadline at submit time:

```ts
// useOnChainSwap.ts (NEW)
import { useSwapSettings } from './useSwapSettings'

export function useSwapExecute() {
  const { deadline: deadlineMinutes } = useSwapSettings()
  // ...
  const swap = useCallback(async (...) => {
    // ...
    const deadlineSecs = Math.max(60, Math.min(180 * 60, deadlineMinutes * 60))
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineSecs)
    // ...
  }, [..., deadlineMinutes])
}
```

Pros: single source of truth, no plumbing through `SwapCard` or
`SwapWalletActions`. Matches how `slippage` is consumed today (read at
the leaf component that needs it).

**Shape B: thread it through props.**

Add `deadlineMinutes?: number` to `swap(...)`, `SwapWalletActions`, and
`SwapCard`. More verbose and easier to forget to pass.

Default to **Shape A** unless planning surfaces a reason to prefer B
(e.g. SSR / test isolation concerns).

### 2. Defensive clamping at the swap site

Even though `setDeadline` already clamps to 1-180 in `useSwapSettings`,
`useSwapExecute` must re-clamp because `localStorage` is attacker-
controllable from the user side and we should never sign a calldata
deadline that is `0`, negative, in the past, or absurdly large. Use:

```ts
const MIN_DEADLINE_SECS = 60         // never sign sub-1-min deadlines
const MAX_DEADLINE_SECS = 180 * 60   // matches the UI cap
const deadlineSecs = Math.max(
  MIN_DEADLINE_SECS,
  Math.min(MAX_DEADLINE_SECS, Math.floor(deadlineMinutes * 60)),
)
```

A 1-minute deadline is fine in absolute terms, but if the user picks
exactly 1 min and there is any wallet-confirmation latency (RainbowKit
modal + ledger device etc.), the tx may revert with `Router: EXPIRED`
before it ever reaches the mempool. Document this in the deadline
input's helper text — see step 4.

### 3. Replace the comment with intent

The current comment `// 20-minute deadline` is now wrong. Replace with:

```ts
// Deadline (epoch seconds). Sourced from user settings — see
// useSwapSettings(). Clamped to [60s, 180m] to match the UI input range
// and to prevent localStorage tampering from forging a deadline of 0
// (which the router would treat as "valid forever").
```

### 4. UX: surface the active deadline in the confirm modal

In `SwapConfirmModal.tsx`, add a single read-only row showing the
deadline that will actually go on-chain:

```
Deadline    1m   ⓘ Tx must land within 1 minute of submission, or it reverts.
```

Reuse the `SwapDetails` row visual style. The tooltip `ⓘ` should
explicitly say "if the tx is held by a relayer or wallet for longer
than this, it reverts harmlessly — protects you from being filled at a
worse price later." This makes the security control visible at the
exact moment the user signs.

### 5. Tests

Add a unit test (Vitest, in `frontend/src/lib/__tests__/`) named
`useOnChainSwap.deadline.test.ts` that:

1. Mocks `useSwapSettings` to return `deadline: 5` (5 minutes).
2. Mocks `useWriteContract().writeContractAsync` to capture the args
   passed to `swapExactTokensForTokens`.
3. Calls `swap(...)` and asserts the 5th arg (the on-chain deadline) is
   `>= now + 240s` and `<= now + 360s` (allowing for the 60s lower-bound
   clamp + 1m of test-runner clock drift).
4. Repeats with `deadline: 0` from `useSwapSettings` and asserts the
   on-chain value is bumped to `now + 60s` (the lower bound), not `0`.
5. Repeats with `deadline: 9999` and asserts the on-chain value is
   capped at `now + 10800s` (180 min upper bound).

If a Vitest harness for the swap hooks does not yet exist, scaffold one
using the same pattern as `useSwapSettings`'s existing tests (search
for any `*.test.ts` next to `useSwapSettings.ts`; if none, the planning
phase should decide whether to introduce a minimal harness or rely on
e2e via `agent-browser`).

## Out of scope

- Replacing the synthetic `priceImpact` formula in `SwapCard.tsx`
  (lines 102-109) with one computed from on-chain reserves. That is a
  separate finding tracked in task 0053.
- Wiring `recordTransaction` from `useSwapSettings.ts` into the swap
  completion path. The "Smart Suggestion" panel in `SwapSettings.tsx`
  is dead code today (no caller ever invokes `recordTransaction`), but
  that is a UX bug, not a security bug, and is out of scope for the
  current security-hardening initiative.
- Any change to `GoodSwapRouter.sol` or its ABI.
- Any change to wallet connection flow or `useAccount`.

## Verification

1. **Unit:** new test file passes.
   `cd frontend && npm test -- useOnChainSwap.deadline` shows ≥3
   passing assertions.
2. **Manual e2e (devnet):** open `https://goodswap.goodclaw.org/`,
   open Advanced → Settings, set deadline = `1` minute, perform a swap
   on a supported pair (G$/WETH or G$/USDC). In the wallet's tx
   confirmation pane, decode the calldata and verify the 5th argument
   to `swapExactTokensForTokens(uint256,uint256,address[],address,uint256)`
   is within 60-120 seconds of "now". A `cast tx <hash>` followed by
   `cast 4byte-decode` is fine.
3. **Manual e2e (long deadline):** repeat with deadline = `120` minutes,
   verify the on-chain deadline is `now + 7200s` (within ±60s).
4. **No regressions:** run the full frontend test suite
   (`npm run test --prefix frontend`) — all swap tests still green.
5. **react-doctor:** `npx -y react-doctor@latest . --verbose --diff`
   from the repo root, score ≥75 on touched files.

## One-week decision

**One-shot.** Two-file change (`useOnChainSwap.ts` +
`SwapConfirmModal.tsx`) plus a new unit-test file. Mechanical plumbing
of an existing setting into an existing call site. No contract changes,
no ABI changes, no new dependencies, low blast-radius. Comparable in
size and risk to the existing `slippage` plumbing that already works.

## Architecture diagram

```
                ┌────────────────────────────────────────┐
                │          SwapSettings.tsx              │
                │   (UI input: 1-180 minutes)            │
                └────────────────┬───────────────────────┘
                                 │ setDeadline(min)
                                 ▼
                ┌────────────────────────────────────────┐
                │        useSwapSettings.ts              │
                │ preferences.settings.deadline (1-180)  │  ←── localStorage
                │ getter:  deadline                      │
                └────────────────┬───────────────────────┘
                                 │ deadline (minutes)
              ┌──────────────────┴──────────────────┐
              │                                     │
              ▼                                     ▼
   ┌────────────────────┐                ┌──────────────────────┐
   │   SwapCard.tsx     │                │  useOnChainSwap.ts   │
   │ reads slippage     │                │   useSwapExecute()   │
   │ (already wired)    │                │  reads deadline ◄── NEW
   └─────────┬──────────┘                │                      │
             │                           │  clamp to [60s,180m] │
             ▼                           │  build BigInt        │
   ┌────────────────────┐                │  pass as 5th arg ◄── NEW
   │ SwapWalletActions  │  swap(...)     │                      │
   │   .swap(...) ──────┼───────────────►│ writeContractAsync({ │
   └────────────────────┘                │   functionName:      │
                                         │ 'swapExactTokensForTokens',
                                         │   args: [..., deadline]
                                         │ })                   │
                                         └──────────┬───────────┘
                                                    │
                                                    ▼
                                       GoodSwapRouter on chain 42069
                                       reverts if block.timestamp > deadline
                                       ↑ now actually reflects user's choice
```
