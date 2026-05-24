# Internal Testnet Runbook (Lane 7)

_Operator-facing runbook for the **internal-only** lane-7 testnet candidate.
Companion to the public-testnet gate (`scripts/testnet/health-gate.sh`)
and contract (`docs/testnet/HEALTH-CONTRACT.md`)._

This runbook documents how to build, deploy, start, reload, smoke, and
roll back the lane-7 stack **without ever touching production**. It is
the source of truth for "how do I bring up an internal testnet candidate
on the lane-7 worktree?"

## Scope and fences

- **Worktree-only.** All commands run from the lane-7 worktree at
  `/home/goodclaw/goodchain-live-prices-lanes/lane7-testnet-setup`. Never
  `cd` into `/home/goodclaw/gooddollar-l2` (the production worktree).
- **No `git push`.** The lane-7 branch is push-fenced by initiative
  constraint. Pushing is handled by the build loop, not by operators.
- **No production restarts.** `pm2 restart goodswap`, `pm2 restart
  goodperps`, `pm2 restart goodpredict` are forbidden in this runbook.
  Lane-7 services use the `-lane7` suffix and lane-local ports
  (49xxx range) so they never collide with the production daemon.
- **Real-trading off.** Every PM2 invocation in this runbook sets
  `REAL_TRADING_ENABLED=false` and `ETORO_MODE` to one of `mock`,
  `demo-readonly`, `sandbox`, or `demo-trading`. The lane-7 cherry-pick
  in `0007g/0004` already sets these defaults on the `price-service`
  PM2 entry; the smoke (`scripts/testnet/internal-smoke.sh`) re-asserts
  them at runtime.
- **No production URLs.** The smoke script and runbook explicitly forbid
  `https://goodswap.goodclaw.org` and `https://rpc.goodclaw.org`. The
  smoke script aborts with a fatal error if any URL points at either.

## One-time setup

1. **Lane-7 env file.** The repository ships
   [`.env.example`](../../.env.example) pre-filled with every key
   this runbook references — mechanical / safety values default to
   the lane-local settings shown below, secret-bearing keys ship
   empty for the operator to fill in.

   Bootstrap on a fresh host:

   ```bash
   cp .env.example .env
   # Then fill in:
   #   - PRIVATE_KEY (Anvil throwaway for local devnet)
   #   - ORACLE_SIGNER_KEY      (only when coordinator provisions one)
   #   - RISK_ENGINE_ADDRESS    (only when HEDGE_DRY_RUN=false is approved)
   ```

   The pre-filled keys (kept here as the documentation reference —
   the smoke's `lib/load-lane7-env.sh` reads them at runtime):

   ```
   # Lane-local PM2 ports (avoid collision with production 9100-9200)
   PRICE_SERVICE_PORT=49300
   PRICE_SERVICE_WS_PORT=49301
   ORACLE_SIGNER_PORT=49107
   HEDGE_ENGINE_PORT=49106
   STATUS_AGGREGATOR_PORT=49200

   # Lane-local devnet RPC (anvil)
   L2_RPC_URL=http://localhost:8545
   LANE7_RPC=http://localhost:8545

   # Hard fences — leave these as-is unless explicit approval
   REAL_TRADING_ENABLED=false
   ETORO_MODE=mock
   HEDGE_DRY_RUN=true
   ORACLE_SIGNER_KEY=
   RISK_ENGINE_ADDRESS=
   ```

   Do not commit `.env`. The repo's top-level `.gitignore` already
   excludes it; `.env.example` itself is gitignore-allowlisted so
   rewrites land cleanly.

2. **Addresses source of truth.** For long-lived deployments,
   `op-stack/addresses.json` and `.autobuilder/addresses.env` are the
   generated artifacts. For a lane-local Anvil reset, the live
   `oracle-signer-lane7` `STOCK_ORACLE_V2_ADDRESS` is authoritative for
   the stock-oracle freshness probe because it is the address receiving
   signer writes. The smoke resolves `STOCK_ORACLE_V2_ADDRESS` from the
   shell / `.env` first, then from `oracle-signer-lane7`'s PM2 env, and
   only then falls back to `op-stack/addresses.json`. It also checks
   `eth_getCode` before calling `lastUpdated()` so stale artifacts fail
   clearly instead of looking like "no signer data yet." Refresh generated
   artifacts after a full devnet redeploy:

   ```bash
   python3 scripts/refresh-addresses.py   # if present on this checkout
   ```

3. **MCP preservation.** `.cursor/mcp.json` is gitignored on this
   branch but the working-copy file must keep the eToro API docs MCP
   entry untouched. Do not delete or overwrite it.

## Build

Per-service builds live inside each backend package. From the lane-7
repo root:

```bash
# Each backend service has its own build
( cd backend/swap-oracle      && npm ci && npm run build )
( cd backend/stocks-keeper    && npm ci && npm run build )
( cd backend/activity-reporter && npm ci && npm run build )
( cd backend/bridge-keeper    && npm ci && npm run build )
( cd backend/harvest-keeper   && npm ci && npm run build )
( cd backend/indexer          && npm ci && npm run build )
( cd backend/liquidator       && npm ci && npm run build )
( cd backend/monitor          && npm ci && npm run build )
( cd backend/revenue-tracker  && npm ci && npm run build )
( cd backend/rpc-balancer     && npm ci && npm run build )
( cd backend/hedge-engine     && npm ci && npm run build )
( cd backend/oracle-signer    && npm ci && npm run build )
( cd backend/price-service    && npm ci && npm run build )
# status-aggregator runs ts-node directly (no compiled output)
( cd backend/status-aggregator && npm ci )

# Frontend (next build)
( cd frontend && npm ci && npm run build )
```

Each `dist/index.js` is the entry point referenced by
`backend/ecosystem.config.js`. The new `price-service` PM2 entry (added
by `0007g/0004` cherry-pick of lane 1's `6b99f069`) consumes
`backend/price-service/dist/index.js`.

## Start (lane-local)

Lane-local PM2 entries use the `-lane7` suffix and the 49xxx port range.
Do **not** use `pm2 start backend/ecosystem.config.js` directly — that
would clash with production app names. Instead start each service with
explicit `--name <svc>-lane7` and lane-local ports:

```bash
# Dependency order: producers → signers → consumers → aggregator → frontend
pm2 start backend/price-service/dist/index.js \
  --name price-service-lane7 \
  -- \
  --port "$PRICE_SERVICE_PORT" --ws-port "$PRICE_SERVICE_WS_PORT"

pm2 start backend/oracle-signer/dist/index.js \
  --name oracle-signer-lane7 \
  --env ORACLE_SIGNER_PORT="$ORACLE_SIGNER_PORT" \
  --env PRICE_SERVICE_URL="ws://localhost:$PRICE_SERVICE_WS_PORT"

pm2 start backend/hedge-engine/dist/index.js \
  --name hedge-engine-lane7 \
  --env HEDGE_ENGINE_PORT="$HEDGE_ENGINE_PORT" \
  --env HEDGE_DRY_RUN=true

pm2 start backend/status-aggregator/src/index.ts \
  --interpreter backend/status-aggregator/node_modules/.bin/ts-node \
  --name status-aggregator-lane7 \
  --env PORT="$STATUS_AGGREGATOR_PORT" \
  --env HEDGE_ENGINE_PORT="$HEDGE_ENGINE_PORT" \
  --env ORACLE_SIGNER_PORT="$ORACLE_SIGNER_PORT" \
  --env PRICE_SERVICE_PORT="$PRICE_SERVICE_PORT"
```

Lane-local port table:

| service              | lane-local port | PM2 name                    |
|----------------------|-----------------|-----------------------------|
| `price-service`      | `49300` REST    | `price-service-lane7`       |
| `price-service`      | `49301` WS      | (same)                      |
| `oracle-signer`      | `49107`         | `oracle-signer-lane7`       |
| `hedge-engine`       | `49106`         | `hedge-engine-lane7`        |
| `status-aggregator`  | `49200`         | `status-aggregator-lane7`   |

Production reserves `9106 / 9107 / 9200` and `4000 / 4001` — the lane-7
suffix + 49xxx prefix avoid both.

## Reload

Reload (vs restart) is preferred so PM2 zero-downtime swaps the worker:

```bash
# Reload in dependency order so dependents see the new producer
pm2 reload price-service-lane7
pm2 reload oracle-signer-lane7
pm2 reload hedge-engine-lane7
pm2 reload status-aggregator-lane7
```

Use `pm2 restart` only when reload fails or when the binary swap
requires re-resolving a script path (rare; consult `pm2 logs <name>`
first).

## Smoke

After every restart / redeploy, run the lane-local smoke:

```bash
./scripts/testnet/internal-smoke.sh
```

The smoke probes (in order):

1. `price-service /health` → must be `ok`.
2. `oracle-signer /health` → `ok` or `health-only`.
3. `hedge-engine /health` → `ok` or `health-only`.
4. `status-aggregator /status.json` → asserts both `oracle-signer` and
   `hedge-engine` are present and **classified `EXCLUDED`** in
   `HEALTH-CONTRACT.md` (matches the `0007g/0003` contract update).
5. `price-service /quotes/fresh/all` → directly validates the
   URGENT OVERRIDE's "non-empty normalized quotes" evidence. Asserts
   `count >= MIN_FRESH_QUOTES` (default 1) and freshest quote age
   `<= QUOTE_MAX_AGE_S` (default 600 s). Auto-skips when the
   price-service /health response doesn't look like the lane-7
   shape (no `freshQuotes` field); set `PRICE_SERVICE_QUOTES_URL`
   to opt in explicitly when running against custom routes.
6. `StockOracleV2.lastUpdated()` over `LANE7_RPC` → fresh within
   `STALENESS_THRESHOLD_S` (default 600 s). If `LANE7_RPC` is unset,
   the probe is **skipped with a warning** (not a blocker).
7. Real-trading fence — `REAL_TRADING_ENABLED` is `unset` or `false`,
   `ETORO_MODE` ∈ `{mock, demo-readonly, sandbox, demo-trading,
   unset}`, AND `HEDGE_DRY_RUN` ∈ `{true, unset}`. Read from `pm2
   env <id>` when `PM2_ID_PRICE_SERVICE` is exported, otherwise from
   `LANE7_ENV_FILE` (default `.env` at repo root). **Only
   env-presence is logged — values are never printed.** `.env`
   values are forwarded **literally** to the `BLOCKERS[]` console
   echo (the operator's terminal stays byte-faithful so
   typos/quirks are visible) but routed through `escape_md_cell`
   before landing in the Markdown report (so backticks / pipes /
   CR-LF copy-paste artifacts can't scramble the fence section
   that reviewers stare at hardest). `HEDGE_DRY_RUN=false`
   requires explicit coordinator approval per the "Promotion gate"
   section below — the smoke flags any other value as a BLOCKER
   so the fence stays belt-and-suspenders across all three keys.

### Smoke env contract

The smoke loads lane-local overrides from `LANE7_ENV_FILE` (default
`.env` at the repo root) **before** the script's parameter-expansion
defaults resolve, so an operator who follows the "One-time setup"
block above without a separate `set -a; source .env` step still gets
the documented ports / RPC / thresholds applied.

**Precedence.** A shell-exported value always wins over a value in
`.env`. The loader skips its `export` for any key that is already set
in the shell, matching the convention `dotenv`, `pm2 --env`, and
`docker-compose env_file` use. CI / one-shot
`PRICE_SERVICE_PORT=11111 ./internal-smoke.sh` overrides therefore
keep working unchanged.

**Allowlist.** The loader recognizes `PRICE_SERVICE_PORT`,
`PRICE_SERVICE_WS_PORT`, `ORACLE_SIGNER_PORT`, `HEDGE_ENGINE_PORT`,
`STATUS_AGGREGATOR_PORT`, `LANE7_BASE`, `LANE7_RPC`,
`STALENESS_THRESHOLD_S`, `MIN_FRESH_QUOTES`, `QUOTE_MAX_AGE_S`, the
four per-service `*_URL` escape hatches, `PRICE_SERVICE_QUOTES_URL`,
`STOCK_ORACLE_V2_ADDRESS`, `HEALTH_CONTRACT`, `REPORT`, and
`L2_RPC_URL` (operational keys, exported into the shell), plus
`REAL_TRADING_ENABLED` and `ETORO_MODE` (safety-fence keys, kept
presence-only — never exported, so they cannot leak into child
processes). Any other key in `.env` is collected into a single
deferred WARN (`.env keys ignored (not in lane-7 allowlist): ...`)
so typos like `PRICE_SERVICE_PROT=...` surface immediately rather
than silently disappearing.

`STALENESS_THRESHOLD_S`, `MIN_FRESH_QUOTES`, `QUOTE_MAX_AGE_S`, and
`*_PORT` overrides must be plain integers (seconds for the thresholds,
TCP ports `1..65535` for the port vars). Duration suffixes such as
`10m` or `1h` are **not** supported — the smoke fails fast with
`FATAL: <VAR>='<value>' must be a non-negative integer (seconds)`
and exits 2 before running any probe. Use a literal seconds value
(e.g. `STALENESS_THRESHOLD_S=600`, `QUOTE_MAX_AGE_S=600`) and convert
by hand if your operator habit is duration syntax.

`PRICE_SERVICE_QUOTES_URL` is the explicit opt-in override for the
quote-flow probe. By default the smoke derives the URL by stripping
`/health` from `PRICE_SERVICE_URL` and appending `/quotes/fresh/all`.
Operators running behind a reverse proxy with non-default routes
should set this variable explicitly; doing so also bypasses the
auto-skip heuristic that fires when the price-service `/health`
response doesn't contain the expected `freshQuotes` field.

`STOCK_ORACLE_V2_ADDRESS` is an operational override, not a secret. Set
it whenever the lane-local signer targets a contract that differs from
`op-stack/addresses.json`. This is expected after isolated Anvil resets:
the generated artifact may still point at a broadcast address with no
bytecode, while `oracle-signer-lane7` is writing to the fresh local
`StockOracleV2` deployment.

`LANE7_BASE` is **host-only** (e.g. `http://localhost`,
`http://127.0.0.1`). The default URL templates concatenate
`$LANE7_BASE:$PORT/path`, so a `LANE7_BASE` value that already
includes a port (`http://reverse-proxy:8080`) produces an invalid
double-colon URL and the smoke exits 2 with `FATAL: malformed probe
URL`. To probe a single service that lives at a non-default
host:port pair, use the per-service `*_URL` escape hatches
(`PRICE_SERVICE_URL`, `ORACLE_SIGNER_URL`, `HEDGE_ENGINE_URL`,
`STATUS_AGGREGATOR_URL`) — those are passed through verbatim.

The smoke writes `docs/testnet/iter05-internal-smoke.md` and exits 0
(green or green-with-warnings), 1 (one or more blockers), 2 (preflight
failure — bad input, missing tool, unwritable `REPORT`), or 3 (verdict
computed but the report file failed to write mid-run, e.g. disk full
or unmounted volume). Wire it into your post-deploy step:

```bash
./scripts/testnet/internal-smoke.sh && echo "lane-7 internal smoke green"
```

If you see a `WARN: <path> has CRLF line endings` line, run
`dos2unix .env` (or `sed -i 's/\r$//' .env`) so the parser stops
treating Windows-edited values as `false\r` and contradicting itself
in the safety-fence check.

## Rollback

Lane-7 services are independent of production. Roll back in reverse
dependency order:

```bash
pm2 stop status-aggregator-lane7
pm2 stop hedge-engine-lane7
pm2 stop oracle-signer-lane7
pm2 stop price-service-lane7

# Remove from PM2 entirely (does not affect production entries)
pm2 delete status-aggregator-lane7 hedge-engine-lane7 \
  oracle-signer-lane7 price-service-lane7
```

If a code rollback is also needed, reset the lane-7 branch to the SHA
**before** the offending iteration and rebuild:

```bash
# git reset is destructive — only use when you genuinely want to drop
# the in-progress lane-7 commits. Do NOT reset past 86e73194 (main
# merge base). Lane-7 commits before 04be6915 are safe to keep.
git reset --hard <known-good-sha>
```

`git push --force` is forbidden by the initiative constraints.

## Promotion gate (internal candidate → public/shareable testnet)

Promotion to public/shareable testnet is **the coordinator's call**, not
this runbook's. It requires, at minimum:

- The production gate (`scripts/testnet/health-gate.sh`) is green or
  green-with-warnings against the candidate's host.
- `oracle-signer` and `hedge-engine` move out of
  `HEALTH-CONTRACT.md`'s "Documented exclusions" table into the
  REQUIRED list. The contract's "Promotion to release candidate"
  section already calls this out (added by `0007g/0003`). Doing this
  also requires:
  - `ORACLE_SIGNER_KEY` provisioned for testnet on the candidate host.
  - `RISK_ENGINE_ADDRESS` set and `HEDGE_DRY_RUN=false` approved.
- The lane-local internal smoke (`scripts/testnet/internal-smoke.sh`)
  is green for the soak window agreed with the coordinator (default
  guidance: 24 h).
- Lane-2, lane-3, lane-4, lane-5 batch-2 cherry-picks have landed
  cleanly (see `.autobuilder/initiatives/0007g-testnet-setup/integration-plan.md`).

When all of the above are true, the coordinator can request public
promotion separately. Lane 7 stops at "internal candidate" by design —
do not promote without explicit coordinator approval.

## Cross-references

- Contract: [`docs/testnet/HEALTH-CONTRACT.md`](./HEALTH-CONTRACT.md)
- Production gate: [`scripts/testnet/health-gate.sh`](../../scripts/testnet/health-gate.sh)
- Lane-7 internal smoke: [`scripts/testnet/internal-smoke.sh`](../../scripts/testnet/internal-smoke.sh)
- Lane integration plan + blocker list:
  [`.autobuilder/initiatives/0007g-testnet-setup/integration-plan.md`](../../.autobuilder/initiatives/0007g-testnet-setup/integration-plan.md)
- Cherry-pick batch 1 conflict log:
  [`.autobuilder/initiatives/0007g-testnet-setup/iter04-cherry-pick-batch1.md`](../../.autobuilder/initiatives/0007g-testnet-setup/iter04-cherry-pick-batch1.md)
- Health-contract proof:
  [`.autobuilder/initiatives/0007g-testnet-setup/iter03-health-contract-proof.md`](../../.autobuilder/initiatives/0007g-testnet-setup/iter03-health-contract-proof.md)
