# Testnet Health Contract

_Source of truth for what counts as "green" on the public testnet. Owned by
the testnet readiness gate (initiative 0004), iter 2._

The public testnet gate (`scripts/testnet/health-gate.sh`) reads this file's
**Required services** and **Documented exclusions** tables to decide whether
the testnet is shippable right now. To change the gate, change this file.

## Required public surfaces (gate fails if any breaks)

The gate fails with exit code 1 if any of these is broken:

| Surface                                    | Required behavior                                        |
|--------------------------------------------|----------------------------------------------------------|
| `https://goodswap.goodclaw.org/`           | HTTP 200                                                 |
| `https://goodswap.goodclaw.org/faucet`     | HTTP 200                                                 |
| `https://goodswap.goodclaw.org/perps`      | HTTP 200                                                 |
| `https://goodswap.goodclaw.org/portfolio`  | HTTP 200                                                 |
| `https://goodswap.goodclaw.org/tests`      | HTTP 200                                                 |
| `https://goodswap.goodclaw.org/testnet-guide` | HTTP 200                                              |
| `https://goodswap.goodclaw.org/api/status` | Reachable, parses as JSON, has `services[]`              |
| `https://rpc.goodclaw.org` (`eth_blockNumber`) | Returns a hex block, and a second read ≥ 6 s later returns a strictly higher block (chain advancing) |
| `op-stack/addresses.json`                  | Exists, parses as JSON, contains ≥ 1 contract address    |

## Required services in `/api/status`

These services must be `ok` for the gate to pass. Anything else (`degraded`,
`error`, `unreachable`, missing) is a blocker.

| service         | role                                          |
|-----------------|-----------------------------------------------|
| `swap-oracle`   | swap pricing                                  |
| `liquidator`    | perp/lend liquidations                        |
| `stocks-keeper` | stocks oracle and market hours                |
| `rpc-balancer`  | public RPC fronting                           |
| `bridge-keeper` | bridge/claim worker                           |
| `perps`         | GoodPerps API                                 |
| `predict`       | GoodPredict API                               |

## Documented exclusions (warn but pass)

These services are knowingly degraded and have a named owner iteration in
`docs/TESTNET-READINESS-50-ITERATIONS.md`. The gate logs them as `EXCLUDED`
and does not fail on them. The line "owner iter" must always point at a
specific row in the 50-iter plan; if a service has no owner, it is not
excluded — it is a blocker.

| service             | reason                                                 | owner iter   |
|---------------------|--------------------------------------------------------|--------------|
| `activity-reporter` | flapping `waiting restart` loop, very high restart count | 4          |
| `harvest-keeper`    | flapping `waiting restart` loop, very high restart count | 4          |
| `revenue-tracker`   | flapping `waiting restart` loop                          | 4          |
| `indexer`           | reports `error` (chain reorg / config) — needs reset      | 6          |
| `monitor`           | reports `degraded` (RPC sampling)                         | 6          |
| `oracle-signer`     | runs in health-only mode until `ORACLE_SIGNER_KEY` is provisioned for testnet | lane7/0007g |
| `hedge-engine`      | runs in dry-run / health-only mode until `RISK_ENGINE_ADDRESS` is set and `HEDGE_DRY_RUN=false` is approved | lane7/0007g |

When iter 4 / iter 6 actually fix a service, **remove it from the exclusion
table above**. The gate script reads the table from this file at runtime, so
no code change is required.

## Promotion to release candidate (iter 50)

The release candidate gate (iter 50) clears all exclusions: every service in
`/api/status` must be `ok`, the chain must be advancing, and every public
page must return 200. Until then, the per-iteration gate is allowed to ship
with the documented exclusions above. Promotion gate explicitly requires
that **`oracle-signer` and `hedge-engine` move out of the exclusion table
into REQUIRED** before any public/shareable testnet promotion — same
treatment as the iter-4 services (`activity-reporter`, `harvest-keeper`,
`revenue-tracker`) and the iter-6 services (`indexer`, `monitor`). Lane 7
classifies them as `lane7/0007g`-owned exclusions; promotion clears them.

## Usage

```bash
# default — runs against the live public testnet
./scripts/testnet/health-gate.sh

# override the public base for staging or local probing
PUBLIC_BASE=https://staging.goodclaw.org ./scripts/testnet/health-gate.sh

# override the report destination
REPORT=/tmp/gate.md ./scripts/testnet/health-gate.sh
```

The gate prints a 1-screen summary, writes a Markdown report (default
`docs/testnet/iter02-health-gate.md`), and exits 0 only when there are no
blockers.
