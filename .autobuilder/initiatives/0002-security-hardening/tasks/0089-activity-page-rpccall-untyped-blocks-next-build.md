---
id: gooddollar-l2-activity-page-rpccall-untyped-blocks-next-build
title: "CRITICAL — `next build` fails with `Property 'number' does not exist on type '{}'` in activity/page.tsx — 4 `rpcCall` sites pass no generic, leaving block/tx/receipt as `unknown` and blocking the entire frontend deploy"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [critical, frontend, typescript, build-break, regression, blocks-deploy, blocks-0087, blocks-0088, production-outage]
---

# CRITICAL — `next build` panics on `activity/page.tsx`, PM2 `goodswap` stuck in `waiting restart` loop (140 restarts), site is fully down

## Observed (iter44, while validating task 0087 in flight, 2026-05-16 13:08 UTC)

While preparing to run `npm run build` from `frontend/` to validate task
0087's new `postbuild` hook end-to-end, `next build` failed at the
type-check phase:

```
Failed to compile.

./src/app/activity/page.tsx:125:44
Type error: Property 'number' does not exist on type '{}'.

  123 |       for (const block of blockResults) {
  124 |         if (!block) continue
> 125 |         const blockNum = hexToNumber(block.number)
      |                                            ^
  126 |         const timestamp = hexToNumber(block.timestamp)
  127 |         const txs = block.transactions || []
  128 |
ELIFECYCLE  Command failed with exit code 1.
```

Confirmed live impact on PM2:

```
$ pm2 list | grep goodswap
│ 1  │ goodswap │ default │ N/A │ fork │ 3792266 │ 0 │ 140 │ waiting restart │ ...

$ ls /home/goodclaw/gooddollar-l2/frontend/.next/BUILD_ID
ls: cannot access '.next/BUILD_ID': No such file or directory
```

The PM2 process has restarted **140 times** because `.next/BUILD_ID` does
not exist — the last successful build was wiped or never completed, and
every subsequent `next build` attempt has been blocked by this type
error since `lib/rpc.ts` was refactored (in task 0069) to make
`rpcCallStrict` strictly generic with `T = unknown` as a default.

The four call sites in `activity/page.tsx` that consume the result —
`rpcCall(...)` for `eth_getBlockByNumber`, `eth_getTransactionReceipt`,
`eth_getBalance`, `eth_getTransactionCount` — were left without explicit
generic arguments. With `T` defaulting to `unknown`, the awaited values
become `{}` after the `if (!block) continue` narrow, and `block.number`
is therefore unresolvable. TypeScript correctly refuses to compile.

This is the **root cause** behind tasks 0060, 0085, and 0087's unstyled-
site symptom. 0087 added a `postbuild` hook to keep PM2 in sync after a
**successful** build — but no `postbuild` script can run while
`next build` itself fails. **0089 must land before 0087's postbuild hook
can ever fire, before 0088 can be deployed, and before the site can be
served at all.**

## Root cause

`lib/rpc.ts` (committed in task 0069) exports:

```ts
export async function rpcCall<T = unknown>(
  url: string,
  method: string,
  params: unknown[] = [],
  options: RpcOptions = {},
): Promise<T>
```

`activity/page.tsx` wraps it correctly:

```ts
function rpcCall<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
  return rpcCallStrict<T>(RPC_URL, method, params)
}
```

…but the **four call sites** never specify `T`:

| Line | Site | Current return type | Needs |
|------|------|--------------------|-------|
| 115  | `rpcCall('eth_getBlockByNumber', ['0x' + i.toString(16), true])` | `unknown` → `{}` after narrow | `EthBlock` (with `transactions: EthTransactionFull[]`) |
| 145  | `rpcCall('eth_getTransactionReceipt', [tx.hash])` | `unknown` → `{}` | `EthReceipt \| null` |
| 173  | `rpcCall('eth_getBalance', [t.address, 'latest'])` | `unknown` | `EthHex` (just `string`) |
| 174  | `rpcCall('eth_getTransactionCount', [t.address, 'latest'])` | `unknown` | `EthHex` |

The site at line 107 already passes `<string>` correctly, which is why
that one compiles. We are simply applying the same pattern uniformly.

## Why this defect class is recurrent

This is the **third unstyled-site outage** caused by `next build` not
completing successfully (iter28 → task 0060, iter40 → task 0085, iter44
→ this task + 0087). The structural pattern is identical: a backend
RPC/type refactor lands, frontend type-checks lag, `next build`
silently stops succeeding, PM2 keeps booting the old artifact until
nginx serves a 400 for a removed CSS hash. Task 0087 fixes the
"build → PM2 reload" link; **0089 fixes the type contract that makes
the build complete in the first place**. Both must land together.

## Acceptance criteria

1. `cd frontend && npx tsc --noEmit` reports **0 errors in `src/app/activity/page.tsx`** (other unrelated errors elsewhere are out of scope for this task — we are surgically fixing only the activity page).
2. `cd frontend && npm run build` completes successfully (exit code 0) and produces `.next/BUILD_ID`.
3. PM2 `goodswap` process status flips from `waiting restart` to `online` after a `pm2 reload` (or 0087's `postbuild` hook runs it automatically), with `pm2 list` showing recent uptime, not 140+ restarts.
4. `curl -ksI http://localhost:3100/` returns `200`.
5. **No behaviour change**: the four `rpcCall` sites continue to return the same runtime values they always did. This is a type-only fix.
6. New shared RPC response interfaces (`EthHex`, `EthBlock`, `EthTransactionFull`, `EthReceipt`) live in `frontend/src/lib/eth-types.ts` so other pages can reuse them and avoid the same trap.

## Out of scope (explicitly deferred)

- The secondary `Module not found: '@react-native-async-storage/async-storage'` warning seen during build is **not** a hard error and is deferred to a follow-up task. It is a warning emitted by `@privy-io/react-auth`'s React Native code path that webpack tree-shakes — confirmed by the fact that previous builds before the activity/page.tsx regression completed successfully despite it.
- Strictly typing every RPC call elsewhere in the codebase. Other pages may still pass `unknown` — fixing them is a separate hygiene task. We are only typing the four sites that block `next build` today.

## Plan (TDD — type-level test first)

### Phase RED — capture the failing baseline

```bash
cd /home/goodclaw/gooddollar-l2/frontend
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "activity/page\.tsx" | head -20
```

Expected: at minimum

```
src/app/activity/page.tsx(125,44): error TS2339: Property 'number' does not exist on type '{}'.
```

(And likely several follow-on errors at lines 126, 127, 131, 132, 133, 145, 147, 148, 152–156 once the first is fixed — all stemming from the same `unknown` propagation. We must drive *all* of them to zero to compile.)

### Phase GREEN — fix in three surgical steps

1. **Create `frontend/src/lib/eth-types.ts`** — minimal shared interfaces for the four RPC method return shapes the activity page actually reads. Keep them lean — only fields used by `activity/page.tsx`. This avoids us inventing a full Ethereum JSON-RPC type universe and keeps the diff under 80 lines.

2. **Import the new types into `activity/page.tsx`** and pass them as explicit generics at all four call sites:
   - `rpcCall<EthBlock | null>('eth_getBlockByNumber', …)`
   - `rpcCall<EthReceipt | null>('eth_getTransactionReceipt', …)`
   - `rpcCall<EthHex>('eth_getBalance', …)`
   - `rpcCall<EthHex>('eth_getTransactionCount', …)`

3. **Narrow `block`** — change `if (!block) continue` to a real type guard so the loop body sees `EthBlock` (not `EthBlock | null`). The existing falsy-check already does this at runtime; TypeScript will follow once the result is `EthBlock | null` instead of `unknown`.

### Phase REFACTOR — verify end-to-end

```bash
cd /home/goodclaw/gooddollar-l2/frontend
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "activity/page\.tsx" | wc -l   # must be 0
npm run build                                                                    # must exit 0
ls -la .next/BUILD_ID                                                            # must exist
pm2 list | grep goodswap                                                         # must show "online" (0087's postbuild hook fires)
curl -ksI http://localhost:3100/ | head -1                                       # must be HTTP/1.1 200
```

## Why no unit test file

This is a **type-only** fix with no runtime behaviour change. The
canonical regression test for a TypeScript bug is `tsc --noEmit` itself,
which already runs as part of `npm run build` on every commit. Adding a
contrived `expectType<EthBlock>(...)` test file would duplicate what
`tsc` already verifies on every build and would not provide additional
safety. The build itself is the test.

We *do* still add the new interfaces in a separate file
(`lib/eth-types.ts`) so future RPC consumers can `import { EthBlock }`
instead of reinventing the same `unknown`-trap.

## Dependencies / blocks

- **Blocks** 0087 (the postbuild PM2 reload hook is implemented but can
  only fire on a successful build, which this task delivers).
- **Blocks** 0088 (perps float→BigInt — can't deploy until `next build`
  succeeds again).
- **Independent of** Slither HIGH-finding work — this is a frontend
  type-check fix that does not touch any Solidity.

## Implementation log

(Filled during execution.)
