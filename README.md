# GoodDollar L2 — The UBI Chain

An OP Stack L2 where every useful transaction funds universal basic income for verified humans.

- Landing: https://goodclaw.org
- App: https://goodswap.goodclaw.org
- Explorer: https://explorer.goodclaw.org
- RPC: https://rpc.goodclaw.org
- Agents / dashboard: https://paperclip.goodclaw.org

## Current Status

_Last refreshed: 2026-05-17 13:30 UTC. Testnet Readiness Gate initiative started._

GoodDollar L2 is live on a persistent devnet and moving toward public testnet.

- Chain ID: `42069`
- Package version: `0.2.0`
- Active autobuilder initiative: `0004-testnet-readiness-gate`
- Active model/executor: Cursor CLI + `claude-opus-4-7-thinking-high`
- Protocol smoke lanes: Swap, Perps, Lend, Stable, Stocks, Predict
- Public services: frontend, explorer, RPC, faucet, status, and docs are the release-critical surfaces
- Current priority: turn the whole public stack green, reproducible, documented, and externally testable
- Testnet readiness plan: `docs/TESTNET-READINESS-50-ITERATIONS.md`
- Architecture + app diagrams: `docs/ARCHITECTURE.md`
- Previous production roadmap: `docs/PRODUCTION-ROADMAP-50-ITERATIONS.md`
- Testnet snapshot: `docs/TESTNET_README.md`
- Dune plan: `docs/DUNE-DASHBOARD-SPEC.md`

## What GoodDollar L2 Does

Every protocol routes a fixed share of fees toward UBI funding:

- GoodSwap — swaps and routing fees
- GoodPerps — trading, funding, and liquidation fees
- GoodPredict — prediction market fees
- GoodLend — lending and liquidation fees
- GoodStable — gUSD stability and PSM fees
- GoodStocks — synthetic stock mint/burn/trading fees
- Bridge — bridge and routing fees
- UBI Claim — verified-human claim path
- Agent economy — agent wallets and automated activity

The target public analytics story is simple: transactions → protocol fees → UBI routed → humans claim.

## Release Gates

Run these before a push/deploy update:

```bash
export PATH="$HOME/.foundry/bin:$HOME/.nvm/versions/node/v22.22.1/bin:$PATH"

# Contracts
forge build
forge test -vvv

# SDK
cd sdk
npm run build
npm test
cd ..

# Frontend
cd frontend
npx tsc --noEmit
npx vitest run --reporter=verbose
cd ..

# Dapp lane tests
for lane in swap perps predict lend stable stocks portfolio-claim explore; do
  ./scripts/run-dapp-lane.sh "$lane"
done

# Live health
bash scripts/health-check.sh
```

Latest local release pass verified:

- Foundry: `1026/1026` tests passing
- SDK: `79/79` tests passing
- Frontend Vitest: `834` passing, `1` skipped
- Dapp lanes: all lanes green
- Health check: OK, with only expected warning when local commits are not yet pushed

## Deploy

Frontend deploy must use the supported script so PM2 reloads after the Next.js build and the live `BUILD_ID` matches disk:

```bash
cd frontend
npm run deploy
```

GitHub Actions also has a devnet deploy workflow:

- `.github/workflows/deploy.yml` — deploy latest `main` or a selected tag via SSH
- `.github/workflows/ci.yml` — typecheck, contracts, frontend, SDK, security
- `.github/workflows/dapp-parallel-tests.yml` — independent dapp lane matrix

## Public Testnet Path

The active testnet gate is tracked in `docs/TESTNET-READINESS-50-ITERATIONS.md`.

The next 50 iterations are organized around:

1. Iterations 1–10 — infra health, PM2/process hygiene, public RPC/explorer/faucet stability
2. Iterations 11–20 — address/env freeze, onboarding, and protocol lane hardening
3. Iterations 21–30 — UBI fee accounting, analytics package, feedback/debug loop
4. Iterations 31–40 — security, risk controls, runbooks, deploy hardening
5. Iterations 41–50 — load/tester/release-candidate gates and final GitHub README/doc refresh

Every 5 iterations the README and testnet docs must be refreshed with current links, architecture diagrams, test evidence, known limitations, and release status. Dune is a release artifact, not a marketing afterthought. If Dune indexing is not available on public testnet day, the interim internal analytics dashboard ships first and Dune remains marked `pending indexing`. Production still requires a public analytics proof layer.

## Security Hardening

Phase 1 security hardening is **complete** — 0 HIGH and 0 MEDIUM Slither findings across all contracts.

| Check | Before | After | Status |
|---|---|---|---|
| HIGH findings | 0 | 0 | Done |
| uninitialized-local | 1 | 0 | Fixed |
| reentrancy-no-eth | 10 | 0 | Fixed |
| unused-return | 20 | 0 | Fixed |
| incorrect-equality | 28 | 0 | Fixed |
| divide-before-multiply | 26 | 0 | Fixed |
| **Total MEDIUM** | **85** | **0** | **Done** |

## Key Docs

- `docs/ARCHITECTURE.md` — system topology and Mermaid diagrams of apps running on GoodDollar L2
- `docs/TESTNET-READINESS-50-ITERATIONS.md` — active 50-iteration readiness sprint with end states and tests
- `docs/TESTNET_README.md` — live testnet readiness snapshot
- `docs/PRODUCTION-ROADMAP-50-ITERATIONS.md` — previous iteration 47→96 production plan
- `docs/DUNE-DASHBOARD-SPEC.md` — Dune dashboard/query requirements
- `docs/SECURITY-AUDIT.md` — security audit notes
- `.autobuilder/status.md` — current autobuilder state
- `.autobuilder/integration-results.md` — latest on-chain smoke matrix

## Development Notes

- Use canonical addresses from `op-stack/addresses.json`.
- Do not hardcode frontend contract addresses when an address exists in the registry.
- Use `frontend/npm run deploy` for live frontend rollout; plain `next build` is not enough.
- Keep Dune/event analytics in mind for every protocol fee path.
- Group progress updates are sent every 5 autobuilder iterations.
