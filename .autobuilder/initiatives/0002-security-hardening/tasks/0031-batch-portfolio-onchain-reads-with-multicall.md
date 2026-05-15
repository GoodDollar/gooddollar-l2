---
id: batch-portfolio-onchain-reads-with-multicall
title: "Perf — Batch PortfolioOnChain reads via wagmi useReadContracts (9 eth_calls every 15s → 1 multicall, kills the worst API waterfall in the app)"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P1
labels: [performance, frontend, multicall, api-waterfall, wagmi, polish]
---

# Perf — Batch PortfolioOnChain reads via wagmi multicall

## Why this task exists

Iteration #11 perf review focus: **API waterfalls** and **components
that block rendering**. The single worst offender observed in this run
is `<PortfolioOnChain>` — a sidebar widget that mounts on most app
pages whenever a wallet is connected.

Every 15 seconds it independently fires **9 separate `eth_call`
requests** against the dev RPC, when all of them could be a single
`multicall3` aggregate call.

### Hard evidence — read the source

```
$ rg -n "useReadContract\(" frontend/src/components/PortfolioOnChain.tsx \
                            frontend/src/lib/useGoodStable.ts \
                            frontend/src/lib/useGoodLend.ts
frontend/src/components/PortfolioOnChain.tsx:47:  const gdResult = useReadContract({...balanceOf...})
frontend/src/lib/useGoodStable.ts:??:             useReadContract  ×2 inside useVault
frontend/src/lib/useGoodStable.ts:??:             useReadContract  ×1 inside useGUSDBalance
frontend/src/lib/useGoodLend.ts:??:               useReadContract  ×1 inside useUserAccountData
```

Counting the actual fan-out per render of `<PortfolioOnChain>`:

| Subcomponent          | Hooks invoked                 | eth_calls |
|-----------------------|-------------------------------|-----------|
| `<TokenBalances>`     | `useReadContract balanceOf`   | 1 (G$)    |
|                       | `useGUSDBalance` (1 read)     | 1 (gUSD)  |
| `<LendPosition>`      | `useUserAccountData` (1 read) | 1         |
| `<StableVaultRow>` ×3 | `useVault` (2 reads each)     | 6         |
|                       |                               | **= 9**   |

Each of those hooks sets `query: { refetchInterval: 15_000 }`, so the
panel re-fires all 9 every 15 seconds for as long as the user has the
wallet connected.

In a freshly opened `/stable` tab with PortfolioOnChain mounted I
counted **9 eth_call requests** per refresh cycle in DevTools Network
filtered by `localhost:8545`, plus the `/stable` page itself adding
another ~10 (separate task tracks page-level reads, see 0030 for
context). All 19 fire in parallel volleys instead of one batched
request.

### Why this matters

1. **Latency**: with 9 round-trips every 15s, even at 5ms RTT we burn
   45ms of network time per cycle for data that fits in 1 multicall.
2. **RPC load**: the Anvil dev node logs 9 lines per cycle per
   connected wallet. With multiple browser tabs open this saturates the
   dev RPC quickly. On a real public RPC (post Phase 2) every extra
   `eth_call` is a billable unit.
3. **Caching**: when the same `useReadContract` keys are scattered
   across 6 hook instances they don't share React Query cache entries
   even though they target the same data on the same block. A single
   multicall keyed by a stable contract array gives us one cache entry
   that all subscribers can read.

The codebase already has the right pattern in
`frontend/src/lib/useOnChainMarketData.ts`, which uses
`wagmi`'s `useReadContracts` (plural) to fetch the entire market data
sheet in one multicall — so this is just applying the same pattern
where it's missing most.

## Acceptance Criteria

A.  `<PortfolioOnChain>` makes **at most 1** `eth_call` per refresh
    cycle (one `multicall3.aggregate3` call), down from 9.
B.  All current data shown in the panel still renders correctly:
    - G$ balance + gUSD balance row
    - GoodLend supplied / borrowed / health factor row (when position
      exists)
    - 3× GoodStable vault rows (ETH / G$ / USDC) with collateral, debt
      and health factor — but only rendered for ilks where the user
      has a non-zero position (existing behavior preserved).
C.  Refresh interval stays 15s and is unified across all reads — they
    all refresh together, not on staggered timers.
D.  Loading state: the panel shows the existing "Loading…" placeholder
    while the single multicall is pending, instead of partial data
    flashing in.
E.  Error state: if the multicall fails, the panel does not crash. It
    keeps the previous values and silently retries on the next 15s
    tick (same behavior as today's individual hooks, just consolidated).
F.  Public exports of `useGoodStable` (`useVault`, `useGUSDBalance`,
    `ILKS`, `ILK_ETH`, `ILK_GD`, `ILK_USDC`) and `useGoodLend`
    (`useUserAccountData`) **stay unchanged** — other pages depend on
    them. The batching only happens *inside*
    `PortfolioOnChain.tsx` via a new local hook.
G.  Network tab on `/stable` (with wallet connected to chain 42069)
    shows exactly 1 eth_call from `<PortfolioOnChain>` per 15s tick,
    verified via filter `localhost:8545` + `multicall3` method
    selector `0x82ad56cb` (or `0x252dba42` for legacy aggregate).

## Implementation Sketch

Add a private hook inside `PortfolioOnChain.tsx` (or co-located in
`frontend/src/lib/usePortfolioReads.ts`) that builds one
`useReadContracts` call:

```ts
import { useReadContracts } from 'wagmi'

function usePortfolioReads(address: `0x${string}` | undefined) {
  return useReadContracts({
    contracts: address ? [
      // ── token balances
      { address: CONTRACTS.GoodDollarToken, abi: GoodDollarTokenABI,
        functionName: 'balanceOf', args: [address] },
      { address: CONTRACTS.GoodStable, abi: GoodStableABI,
        functionName: 'gusdBalanceOf', args: [address] },

      // ── GoodLend account data (single struct return)
      { address: CONTRACTS.GoodLend, abi: GoodLendABI,
        functionName: 'getUserAccountData', args: [address] },

      // ── 3× vault reads (urn + ilk for each)
      { address: CONTRACTS.GoodStable, abi: GoodStableABI,
        functionName: 'urns', args: [ILK_ETH, address] },
      { address: CONTRACTS.GoodStable, abi: GoodStableABI,
        functionName: 'ilks', args: [ILK_ETH] },
      { address: CONTRACTS.GoodStable, abi: GoodStableABI,
        functionName: 'urns', args: [ILK_GD, address] },
      { address: CONTRACTS.GoodStable, abi: GoodStableABI,
        functionName: 'ilks', args: [ILK_GD] },
      { address: CONTRACTS.GoodStable, abi: GoodStableABI,
        functionName: 'urns', args: [ILK_USDC, address] },
      { address: CONTRACTS.GoodStable, abi: GoodStableABI,
        functionName: 'ilks', args: [ILK_USDC] },
    ] : [],
    allowFailure: true,
    query: {
      enabled: !!address,
      refetchInterval: 15_000,
    },
  })
}
```

Then in the component, fan out the results to the same shape the
sub-rows already expect:

```ts
const { data, isLoading } = usePortfolioReads(address)

const gdBalance   = data?.[0]?.result ? Number(formatUnits(data[0].result, 18)) : 0
const gusdBalance = data?.[1]?.result ? Number(formatUnits(data[1].result, 18)) : 0
const lend        = data?.[2]?.result    // shape matches getUserAccountData
const ethVault    = computeVault(data?.[3]?.result, data?.[4]?.result, 18,  ethPrice,  1.5)
const gdVault     = computeVault(data?.[5]?.result, data?.[6]?.result, 18,  gdPrice,   2.0)
const udcVault    = computeVault(data?.[7]?.result, data?.[8]?.result, 6,   usdcPrice, 1.01)
```

`computeVault()` is just the existing math from `useVault()` extracted
into a pure function — same formula, no on-chain reads.

## Files in scope

- `frontend/src/components/PortfolioOnChain.tsx` — replace per-row
  `useVault` / `useGUSDBalance` / `useUserAccountData` with one
  `useReadContracts` + local pure helpers.
- `frontend/src/lib/useGoodStable.ts` — extract the post-fetch math
  from `useVault()` into a pure exported helper (e.g.
  `computeVaultState(...)`) that both the existing `useVault()` and
  the new batched path can call. Do NOT change the public signature
  of `useVault()`.
- (Optional) `frontend/src/lib/usePortfolioReads.ts` — new file if
  the hook gets long enough to warrant extraction.

## Out of scope

- Refactoring `<SwapCard>`, `<SwapPriceChart>`, `<StableTotalSupply>`
  or other unrelated components (separate review work — kept in this
  initiative's spec by reusing the same pattern when those hooks are
  next touched).
- Touching `frontend/src/app/(app)/stable/page.tsx` (its ~10 reads
  are tracked as a follow-up in iteration #12; this task explicitly
  scopes only to `<PortfolioOnChain>`).
- Any change to ABI files or contract addresses.
- Any backend / Solidity changes.

## Definition of Done

- DevTools Network on `/stable` filtered by `localhost:8545` shows ≤
  1 `eth_call` originating from `<PortfolioOnChain>` per 15s tick,
  vs. 9 today. Verified by counting `multicall3` requests in the panel.
- All visible numbers in the panel match what the page showed before
  the change (G$ balance, gUSD balance, lend collateral / debt /
  health, three vault rows). Compare side-by-side in dev.
- `cd frontend && npm test` is green (and the existing
  `useGoodStable` / `useGoodLend` tests still pass since their public
  hooks are unchanged).
- `npx -y react-doctor@latest . --verbose --diff` passes (≥ 75) on
  the modified files.
- README "Security Hardening / Performance" section gets a one-line
  entry under iteration #11.
