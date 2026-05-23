# Lane-7 Internal Smoke — Future-Dated `lastUpdated()` Proof (task 0007g/0011)

_Captured 2026-05-23. Source script:
`scripts/testnet/internal-smoke.sh`. Driver:
`.autobuilder/initiatives/0007g-testnet-setup/proof/run-future-dated.sh`._

The on-chain freshness block now treats a negative `age_s` (future-dated
`StockOracleV2.lastUpdated()`) as a **WARN**, not a silently-passing
GREEN row. Previous behaviour: `(( age_s > STALENESS_THRESHOLD_S ))`
returned false on negatives, so the smoke printed
`✅ ... age -86400 s ≤ 600 s` — a contradictory line that masked clock
skew on the signer host or a malicious signer writing
`block.timestamp + 1h`.

The new branch fires the WARN before the existing staleness comparison
runs, so:
- `age_s < 0`           → WARN (timestamp is N s in the future)
- `age_s == 0`          → OK (zero-age boundary preserved)
- `0 < age_s ≤ thresh`  → OK (unchanged)
- `age_s > thresh`      → BLOCKER (unchanged)

## What changed in `internal-smoke.sh`

```bash
if (( age_s < 0 )); then
  future_s=$(( -age_s ))
  add_summary "⚠️  StockOracleV2.lastUpdated() = $last_updated is ${future_s}s in the future — check signer host clock / NTP"
  WARNINGS+=("on-chain oracle timestamp is ${future_s}s in the future (LANE7_RPC=$LANE7_RPC)")
elif (( age_s > STALENESS_THRESHOLD_S )); then
  ...existing blocker branch...
else
  ...existing OK branch (unchanged)...
fi
```

Rationale for WARN over BLOCKER: the smoke cannot disambiguate "signer
wrote a future timestamp" from "operator host clock is behind NTP".
Promoting to BLOCKER would lock out operators with sloppy host clocks
during a fire-drill. Promotion-gate decisions about candidate → public
testnet can decide separately whether to escalate this WARN (out of
scope here, see `HEALTH-CONTRACT.md`).

## What changed in `proof/fake-status-server.js`

The `lane7-smoke-rpc-fresh` profile previously hard-coded its
`lastUpdated()` value at `now - 60`. It now reads the offset from a
single env var so test drivers can drive every freshness branch:

```js
const offset = parseInt(process.env.RPC_LAST_UPDATED_OFFSET || '-60', 10);
const ts = Math.floor(Date.now() / 1000) + offset;
```

Default `-60` keeps iter06 byte-identical (modulo the new wallclock).

## Driver output

```
=== Case A: future +86400s (RPC_LAST_UPDATED_OFFSET=86400) ===
exit: 0
PASS  WARN line surfaced (86400s in the future)
PASS  no contradictory negative-age row

=== Case B: exact-now (offset 0) (RPC_LAST_UPDATED_OFFSET=0) ===
exit: 0
PASS  zero-age boundary
PASS  no future-drift WARN at offset 0

=== Case C: 1h ago (-3600s, threshold 600) (RPC_LAST_UPDATED_OFFSET=-3600) ===
exit: 1
PASS  stale BLOCKER fires

=== Case D: default offset -60 (RPC_LAST_UPDATED_OFFSET=-60) ===
exit: 0
PASS  default fresh row
PASS  no future-drift WARN at default offset

ALL CASES PASS
```

## Captured reports

### Case A — future by 24 h

```
**Verdict:** `GREEN-with-warnings`
**Exit code:** `0`
...
- WARN: on-chain oracle timestamp is 86400s in the future (LANE7_RPC=http://127.0.0.1:49622)
...
## On-chain oracle freshness

⚠️  StockOracleV2.lastUpdated() = <future_ts> is 86400s in the future — check signer host clock / NTP
```

The smoke no longer prints the contradictory `✅ ... age -86400 s ≤ 600 s`
line that previously masked the anomaly.

### Case B — exact-now (zero-age boundary)

```
**Verdict:** `GREEN-with-warnings`
**Exit code:** `0`
...
## On-chain oracle freshness

✅ StockOracleV2.lastUpdated() = <now_ts>; age 0 s ≤ 600 s
```

### Case C — 1 h stale

```
**Verdict:** `RED`
**Exit code:** `1`
- BLOCKER: on-chain oracle stale (age 3600s > 600s)
...
## On-chain oracle freshness

❌ StockOracleV2.lastUpdated() = <past_ts>; age 3600 s > threshold 600 s
```

### Case D — default offset −60 (regression baseline)

```
**Verdict:** `GREEN-with-warnings`
**Exit code:** `0`
...
## On-chain oracle freshness

✅ StockOracleV2.lastUpdated() = <fresh_ts>; age 60 s ≤ 600 s
```

Iter06 `run-rpc-timeout.sh` reruns clean — Cases A/B/C of the
existing driver still pass byte-identical (modulo timestamps).

## Pointers

- Smoke script: [`scripts/testnet/internal-smoke.sh`](../../../scripts/testnet/internal-smoke.sh)
- Driver: [`proof/run-future-dated.sh`](./proof/run-future-dated.sh)
- Harness profile: `lane7-smoke-rpc-fresh` in [`proof/fake-status-server.js`](./proof/fake-status-server.js)
- PRD: [`tasks/0011-smoke-future-dated-last-updated-passes-as-fresh.md`](./tasks/0011-smoke-future-dated-last-updated-passes-as-fresh.md)
