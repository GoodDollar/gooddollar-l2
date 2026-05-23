# Lane-7 Internal Smoke — `STOCK_ORACLE_V2_ADDRESS` Shape Proof (task 0007g/0014)

_Captured 2026-05-23. Source script:
`scripts/testnet/internal-smoke.sh`. Driver:
`.autobuilder/initiatives/0007g-testnet-setup/proof/run-address-validation.sh`._

The on-chain freshness branch now refuses to call eth_call with an
obviously malformed `StockOracleV2` address. Previously any invalid
input (typo, wrong type in JSON, trailing whitespace, CRLF) made the
RPC reject the call; the bash side mapped that to `last_updated == 0`
and printed the misleading
`⚠️ fresh oracle absent (testnet candidate phase)` WARN — exactly
the message an operator expects to see during a genuinely-pre-deploy
testnet, so they took no action while their oracle was actually
deployed and writing fine and the smoke was just calling the wrong
contract.

The new gate normalizes the resolved value (strip CR + leading/trailing
whitespace), regex-checks the canonical Ethereum
`^0x[0-9a-fA-F]{40}$` shape, and on mismatch emits a single redacted
`shape invalid` WARN + clears `stock_oracle` so the existing
`address unresolved` skip branch fires the correct WARN. WARN, not
BLOCKER — the testnet candidate phase explicitly tolerates a missing
oracle address, so we keep the operator unblocked while flagging the
real cause.

## What changed in `internal-smoke.sh`

```bash
if [[ -n "$stock_oracle" ]]; then
  stock_oracle="${stock_oracle%$'\r'}"
  stock_oracle="${stock_oracle#"${stock_oracle%%[![:space:]]*}"}"
  stock_oracle="${stock_oracle%"${stock_oracle##*[![:space:]]}"}"
  if [[ ! "$stock_oracle" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
    shape="${stock_oracle:0:10}…(${#stock_oracle} chars)"
    add_summary "⚠️  STOCK_ORACLE_V2_ADDRESS does not look like a 0x-prefixed 20-byte hex address (shape: \`$shape\`) — on-chain freshness skipped"
    WARNINGS+=("STOCK_ORACLE_V2_ADDRESS shape invalid (\`$shape\`) — set a 0x-prefixed 40-hex address")
    stock_oracle=""
  fi
fi
```

Code-judo move: the invalid-address path doesn't introduce a new
`skip_onchain` flag or a new branch in the freshness block. It
reuses the **existing** empty-address skip branch by setting
`stock_oracle=""`. One new code path, no new control-flow concept
for a future maintainer to keep in their head.

## Driver output

```
=== Case A: too-short (0x1234) ===
exit: 0
PASS  shape-invalid WARN
PASS  no misleading 'fresh oracle absent'
PASS  no eth_call freshness row

=== Case B: non-hex (foo) ===
exit: 0
PASS  shape-invalid WARN

=== Case C: trailing space ===
exit: 0
PASS  no shape-invalid WARN
PASS  freshness row from valid normalized addr

=== Case D: trailing CR ===
exit: 0
PASS  no shape-invalid WARN
PASS  freshness row from valid normalized addr

=== Case E: addresses.json:StockOracleV2=12345 (numeric) ===
exit: 0
PASS  shape-invalid WARN (numeric JSON)
PASS  no misleading 'fresh oracle absent'

=== Case F: valid lowercase address ===
exit: 0
PASS  no shape-invalid WARN
PASS  freshness row from valid addr

=== Case G: 80-char garbage ===
shape line: - WARN: STOCK_ORACLE_V2_ADDRESS shape invalid (`XXXXXXXXXX…(80 chars)`) — set a 0x-prefixed 40-hex address
PASS  full input not leaked

ALL CASES PASS
```

## Redaction (criterion 5)

Fed an 80-character garbage input, the shape suffix is:

```
`XXXXXXXXXX…(80 chars)`
```

That's 10 chars of input + `…(80 chars)` = 22 visible characters
total — well under the 30-char ceiling. The full 80-char input
never appears in the report. The first 10 chars are still visible
so a partial typo (`0xdeadbee` etc.) is hinted at without copying
a long secret-shaped string forward.

## Captured reports (excerpts)

### Case A — too-short

```
**Verdict:** `GREEN-with-warnings`
**Exit code:** `0`
- WARN: STOCK_ORACLE_V2_ADDRESS shape invalid (`0x1234…(6 chars)`) — set a 0x-prefixed 40-hex address
...
## On-chain oracle freshness

⚠️  STOCK_ORACLE_V2_ADDRESS does not look like a 0x-prefixed 20-byte hex address (shape: `0x1234…(6 chars)`) — on-chain freshness skipped
⚠️  StockOracleV2 address unknown — set STOCK_ORACLE_V2_ADDRESS or populate op-stack/addresses.json
```

The freshness probe is skipped (no eth_call) and the operator sees
both the new shape WARN and the existing skip WARN — clear distinction
from "fresh oracle absent".

### Case C — trailing space (normalized)

```
**Verdict:** `GREEN-with-warnings`
**Exit code:** `0`
...
## On-chain oracle freshness

✅ StockOracleV2.lastUpdated() = <fresh_ts>; age 60 s ≤ 600 s
```

The trailing whitespace was stripped before the regex, so eth_call
ran successfully against the fixture's `/rpc` handler.

### Case E — `addresses.json` with numeric value

The `console.log(c.StockOracleV2 || "")` snippet inside the smoke
turns `12345` (numeric) into the string `"12345"`. The regex catches
it and the smoke emits the same shape-invalid WARN — no spurious
on-chain probe.

### Case F — valid lowercase (regression baseline)

```
✅ StockOracleV2.lastUpdated() = <fresh_ts>; age 60 s ≤ 600 s
```

Identical to the iter06 RPC-fresh path, modulo timestamp.

## No-regression check

- `proof/run-future-dated.sh` — all four cases still pass.
- `proof/run-rpc-timeout.sh` — all three cases still pass.
- `proof/run-contract-preflight.sh` — all four cases still pass.
- `proof/run-env-crlf.sh` — all three cases still pass.

## Pointers

- Smoke script: [`scripts/testnet/internal-smoke.sh`](../../../scripts/testnet/internal-smoke.sh)
- Driver: [`proof/run-address-validation.sh`](./proof/run-address-validation.sh)
- PRD: [`tasks/0014-smoke-stock-oracle-address-not-validated.md`](./tasks/0014-smoke-stock-oracle-address-not-validated.md)
