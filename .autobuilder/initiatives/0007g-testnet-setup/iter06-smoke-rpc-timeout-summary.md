# Lane-7 Internal Smoke — RPC Timeout Proof Summary (task 0007g/0010)

_Captured 2026-05-23. Source script:
`scripts/testnet/internal-smoke.sh`. Driver:
`.autobuilder/initiatives/0007g-testnet-setup/proof/run-rpc-timeout.sh`.
Captured run: [`iter06-smoke-rpc-timeout.md`](./iter06-smoke-rpc-timeout.md)._

The on-chain freshness probe is now bounded by a 10-second
`req.setTimeout(10000, ...)` matching the curl `--max-time 10` policy
elsewhere in the script. Previously the hand-rolled `node http.request`
had no socket timeout, so a paused/hung/silently-dropping RPC froze
the entire smoke indefinitely — the wrong failure mode during a 3 AM
incident.

A timeout is treated as **warning-grade**, not a blocker (matching
the existing "LANE7_RPC unset" rule). The only blocker path on the
freshness branch remains a stale value above `STALENESS_THRESHOLD_S`.

## What changed in `internal-smoke.sh`

- Added `req.setTimeout(10000, () => { req.destroy(); console.log("TIMEOUT"); process.exit(0); })`
  to the eth_call request. The `process.exit(0)` keeps the node
  child from emitting spurious data after destroy.
- The bash side now branches on the `TIMEOUT` sentinel before the
  existing `"0"` no-data branch and emits a WARN line +
  `WARNINGS+=` entry so the verdict gracefully degrades to
  `GREEN-with-warnings` instead of hanging.
- The existing `req.on("error", ...)` path was tightened with
  `process.exit(0)` for symmetric early termination.

## Driver output (excerpt)

Case A — `nc -l 49600` silent listener (accepts then stalls):

```
=== Case A: silent listener on port 49600 ===
elapsed: 10s, exit: 1
PASS  smoke completed in 10s (≤ 14s including overhead)
PASS  WARN line surfaced
```

Case B — `LANE7_RPC` unset:

```
=== Case B: LANE7_RPC unset ===
exit: 1
PASS  LANE7_RPC unset warning
```

Case C — working RPC fixture (`lane7-smoke-rpc-fresh` profile of
`fake-status-server.js`, returns `now-60` for the
`lastUpdated()` selector `0xd0b06f5d`):

```
=== Case C: working RPC harness on port 49602 ===
exit: 1
PASS  fresh lastUpdated reported
PASS  no spurious timeout on the working RPC path
```

## Captured run (silent listener + green services)

The artifact at [`iter06-smoke-rpc-timeout.md`](./iter06-smoke-rpc-timeout.md)
combines the green services harness (`lane7-smoke-green`) with the
silent RPC listener so the on-chain WARN line surfaces alongside an
otherwise green stack. Verdict: **`GREEN-with-warnings`**,
**exit 0**, wallclock 11 seconds (10 s timeout + small overhead).

```
**Verdict:** `GREEN-with-warnings`
**Exit code:** `0`
...
- WARN: on-chain freshness probe timed out after 10s (LANE7_RPC=http://127.0.0.1:49600)
...
## On-chain oracle freshness

⚠️  StockOracleV2.lastUpdated() probe timed out after 10s (`LANE7_RPC=http://127.0.0.1:49600`)
```

## No-regression check

- Default green proof against `lane7-smoke-green` (no `LANE7_RPC`)
  is byte-identical modulo timestamps — the new branch only fires
  when an `LANE7_RPC` is set AND the underlying socket times out.
- The existing "LANE7_RPC unset" warning path is untouched.

## Pointers

- Smoke script: [`scripts/testnet/internal-smoke.sh`](../../../scripts/testnet/internal-smoke.sh)
- Driver: [`proof/run-rpc-timeout.sh`](./proof/run-rpc-timeout.sh)
- Harness profile: `lane7-smoke-rpc-fresh` in [`proof/fake-status-server.js`](./proof/fake-status-server.js)
- PRD: [`tasks/0010-smoke-rpc-eth-call-has-no-socket-timeout.md`](./tasks/0010-smoke-rpc-eth-call-has-no-socket-timeout.md)
