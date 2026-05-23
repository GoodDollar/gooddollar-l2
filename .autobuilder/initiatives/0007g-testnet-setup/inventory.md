# Lane 7 — Testnet Artifact Inventory

_Pure analysis output for task `0002-inventory-and-integration-plan`. Zero
code changes. Read-only enumeration of what already exists on the lane-7
worktree (HEAD = `3bb4dff2`, on top of main `86e73194`)._

## Testnet scripts (`scripts/testnet/`)

| file                                | role                                                                                               |
|-------------------------------------|----------------------------------------------------------------------------------------------------|
| `health-gate.sh`                    | Production-quality testnet readiness gate. Reads `docs/testnet/HEALTH-CONTRACT.md` at runtime via awk for REQUIRED / EXCLUDED tables; probes `/api/status`, public RPC, and `op-stack/addresses.json`. Source of truth for "is the public testnet shippable right now". |
| `iter01-baseline.sh`                | Initial baseline probe (page reachability + `/api/status` snapshot). Pattern reused later by the gate. |
| `iter01-baseline.sh.smoke.txt`      | Frozen sample output of `iter01-baseline.sh` for archaeology.                                       |
| `iter12-frontend-env-freeze.sh`     | One-shot freeze of `frontend/.env.production` so `next build` is reproducible across nodes.         |
| `iter14-restore-goodswap.sh`        | Recovery script — restores the `goodswap` PM2 entry after a known crash-loop incident.              |
| `check-bundle-no-localhost.sh`      | Asserts the frontend bundle ships no `localhost:` URL (production-build hygiene).                   |

**Note:** No lane-local internal smoke script exists yet. Lane 7 task 0005
adds `scripts/testnet/internal-smoke.sh` to fill this gap.

## Testnet docs (`docs/testnet/`)

| file                                          | role                                                                       |
|-----------------------------------------------|----------------------------------------------------------------------------|
| `HEALTH-CONTRACT.md`                          | Canonical contract: REQUIRED services, documented EXCLUSIONS, promotion gate. Read by `health-gate.sh` at runtime. |
| `iter01-baseline.md`                          | Baseline iteration write-up.                                                |
| `iter02-health-gate.md`                       | Auto-generated report from `health-gate.sh`.                                |
| `iter03-pm2-hygiene.md`                       | Production PM2 hygiene runbook (production-only — lane 7 must not touch prod). |
| `iter12-bundle-before.md`                     | Pre-fix bundle snapshot for the localhost-leak iteration.                    |
| `iter12-bundle-no-localhost.md`               | Post-fix bundle snapshot.                                                    |
| `iter12-frontend-env-freeze.md`               | Documentation of the env freeze and its rationale.                           |
| `iter14-restore-goodswap.md`                  | Companion doc for the recovery script.                                       |
| `iter25-link-check.md`                        | Public link health pass.                                                     |
| `iter25-readme-doc-checkpoint-5.md`           | README + docs checkpoint at iter 25.                                         |
| `iter27-analytics-dashboard.md` (+ `.png`)    | Analytics dashboard validation.                                              |
| `iter28-dune-package.md`                      | Dune query package iteration.                                                |
| `iter29-feedback-pipeline.md`                 | Feedback pipeline iteration write-up.                                        |
| `iter30-link-check.md`                        | Second link health pass.                                                     |
| `iter30-readme-doc-checkpoint-6.md`           | README + docs checkpoint at iter 30.                                         |
| `iter30-stale-build-redeploy.md`              | Stale-build redeploy postmortem.                                             |

**Note:** No internal-only testnet runbook exists yet — `iter03-pm2-hygiene.md`
covers production. Lane 7 task 0005 adds
`docs/testnet/INTERNAL-TESTNET-RUNBOOK.md`.

## General runbooks (`docs/runbooks/`)

| file                                | role                                                                       |
|-------------------------------------|----------------------------------------------------------------------------|
| `frontend-rebuild.md`               | How to rebuild the frontend without cache surprises.                        |
| `pool-misconfigured.md`             | Recovery for misconfigured swap-pool state.                                 |

## PM2 entries — `backend/ecosystem.config.js`

Each row lists the registered PM2 app, its bound port (where applicable),
and the env-driven fences that keep it safe in testnet/health-only mode.
Every app inherits `BASE_ENV` (`L2_RPC_URL`, `OPERATOR_PRIVATE_KEY`,
`GDT_ADDRESS`, `UBI_FEE_SPLITTER`, `CHAIN_ID`).

| app                 | port              | testnet fences                                                                                  |
|---------------------|-------------------|-------------------------------------------------------------------------------------------------|
| `swap-oracle`       | (no health port)  | Reads only — `SWAP_ORACLE_UPDATE_INTERVAL_MS=900_000` default.                                  |
| `stocks-keeper`     | (no health port)  | Reads only — `STOCKS_KEEPER_UPDATE_INTERVAL_MS=900_000` default.                                |
| `activity-reporter` | `9101` (poll)     | Reads chain only.                                                                               |
| `bridge-keeper`     | `3006` (poll)     | Bridge claim worker.                                                                            |
| `harvest-keeper`    | `9102` (poll)     | Harvest worker.                                                                                 |
| `indexer`           | `4200` (poll)     | Read-only chain indexer.                                                                        |
| `liquidator`        | `9103` (poll)     | Liquidations worker — uses `OPERATOR_PRIVATE_KEY`.                                              |
| `monitor`           | `4201` (poll)     | Read-only chain sampling.                                                                       |
| `revenue-tracker`   | `9104` (poll)     | Reads `UBI_REVENUE_TRACKER` and `UBI_FEE_SPLITTER`.                                             |
| `rpc-balancer`      | `8547` (PORT)     | Public RPC fronting; default `UPSTREAM_RPCS=http://localhost:8545`.                             |
| `status-aggregator` | `9200` (PORT)     | Read-only — polls every health port and produces `/status.json`.                                |
| `hedge-engine`      | `9106` (HEDGE_ENGINE_PORT) | `HEDGE_DRY_RUN=true` default; `RISK_ENGINE_ADDRESS=''` default → starts in **health-only mode** (engine loop disabled, health port still bound). |
| `oracle-signer`     | `9107` (ORACLE_SIGNER_PORT) | `ORACLE_SIGNER_KEY=''` default → starts in **health-only mode** (submission loop disabled, health port still bound). |
| `goodswap`          | `3100` (PORT)     | `next start` — pinned `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`. **Production frontend.**            |

**Gap on `main`:** `price-service` is **not** registered. Lane 1's clean
head `6b99f069` is the commit that adds it (`script: 'price-service/dist/index.js'`,
`ETORO_MODE=mock` default). Cherry-picked in task 0004.

## `backend/status-aggregator/src/index.ts` polled services

`SERVICES[]` (lines 24–39) registers 14 services, each polled at
`http://localhost:<PORT>/health` (or `/api/health` for `indexer`):

```
swap-oracle (9100)        activity-reporter (9101)   harvest-keeper (9102)
liquidator (9103)         revenue-tracker (9104)     stocks-keeper (9105)
indexer (4200)            monitor (4201)             rpc-balancer (8546)
bridge-keeper (3006)      perps (8082)               predict (3040)
hedge-engine (9106)       oracle-signer (9107)
```

Both **`hedge-engine`** and **`oracle-signer`** are already polled. They are
visible in `/status.json` today but not classified by the contract — task
0003 fixes that.

`price-service` is not in this list. Adding it is downstream of the lane 1
cherry-pick and is intentionally **deferred to a follow-up task** (not this
batch) so 0004 stays surgical.

## `docs/testnet/HEALTH-CONTRACT.md` surfaces

### Required public surfaces
`/`, `/faucet`, `/perps`, `/portfolio`, `/tests`, `/testnet-guide`,
`/api/status`, public RPC `eth_blockNumber` (must advance ≥ 6 s),
`op-stack/addresses.json` (≥ 1 contract address).

### Required services
`swap-oracle`, `liquidator`, `stocks-keeper`, `rpc-balancer`,
`bridge-keeper`, `perps`, `predict`. Anything not `ok` blocks.

### Documented exclusions (warn but pass)
| service             | reason                                                  | owner iter |
|---------------------|---------------------------------------------------------|------------|
| `activity-reporter` | flapping waiting-restart loop, very high restart count  | 4          |
| `harvest-keeper`    | flapping waiting-restart loop, very high restart count  | 4          |
| `revenue-tracker`   | flapping waiting-restart loop                           | 4          |
| `indexer`           | reports `error` (chain reorg / config) — needs reset    | 6          |
| `monitor`           | reports `degraded` (RPC sampling)                       | 6          |

**Gap:** `oracle-signer` and `hedge-engine` are present in
`/status.json` (because `status-aggregator` polls them) but **not** in
either table — `health-gate.sh` line 171–180 emits them as
`⚠️ UNCLASSIFIED` warnings. Task 0003 closes this gap by adding both as
documented exclusions with owner iter `lane7/0007g`.

## Source-of-truth pointers

- **Contract**: `docs/testnet/HEALTH-CONTRACT.md` — edit this to change
  what the gate considers green.
- **Gate runner**: `scripts/testnet/health-gate.sh` — never edit to change
  classification (the contract drives it via awk).
- **PM2 supervisor**: `backend/ecosystem.config.js` — single source of
  truth for what the production / testnet host runs.
- **Status producer**: `backend/status-aggregator/src/index.ts` `SERVICES[]`
  — single source of truth for what `/status.json` reports.
