# GoodDollar L2 Testnet Readiness

_Last updated: 2026-05-16 06:28 UTC by `scripts/update-testnet-readme.py`._

## Current Build

- Branch: `main`
- Snapshot source: committed README + GitHub Actions history for this branch
- Package version: `0.2.0`
- Autobuilder iteration: `28`
- Chain: GoodDollar L2 Devnet (`42069` configured, `42069` live)
- Latest local block: `105574`

## Public Endpoints

- Frontend: HTTP 200 — https://goodswap.goodclaw.org
- Landing: HTTP 200 — https://goodclaw.org
- Explorer: HTTP 200 — https://explorer.goodclaw.org
- RPC HTTPS: HTTP 200 chainId=0xa455 — https://rpc.goodclaw.org
- Paperclip: HTTP 200 — https://paperclip.goodclaw.org

## Release Gate Status

- CI: GitHub `CI` was green on latest pushed `main` before this README generation; every push must re-check.
- On-chain protocol smoke: 6/6 protocol smoke tx lanes green
- Frontend E2E: matrix workflow `Parallel Dapp Tests` covers each dapp lane independently.
- Deployment: devnet deployment workflow is `Deploy to Devnet`.
- Required before public testnet: persistent OP Stack chain, faucet, final canonical address sync, explorer indexing check, Dune dashboard/indexing.

## Dune Public Analytics

- Status: included in the testnet move plan.
- Spec: `docs/DUNE-DASHBOARD-SPEC.md`.
- Launch requirement: public proof dashboard for network usage, protocol activity, UBI fee routing, agent economy, faucet funnel, and success/revert rates.
- Indexing note: local chain `42069` uses internal indexer until the public testnet is Dune-indexed or Dune indexing is requested.

## Protocol Smoke Matrix

- GoodSwap: `0x2d754b4766b0…` (✅ success)
- GoodPerps: `0x347004916a8d…` (✅ success)
- GoodLend: `0x43a7ab0a5189…` (✅ success)
- GoodStable: `0x2306c5aef499…` (✅ success)
- GoodStocks: `0x2466691c12c7…` (✅ success)
- GoodPredict: `0xda2a9e27ec2f…` (✅ success)

## Canonical Contract Addresses

- GoodDollarToken: `0x8f86403a4de0bb5791fa46b8e795c547942fe4cf`
- UBIFeeSplitter: `0x809d550fca64d94bd9f66e60752a544199cfac3d`
- UBIClaimV2: `0x9d4454b023096f34b160d6b654540c56a1f81688`
- GoodSwapRouter: `0x975cdd867acb99f0195be09c269e2440aa1b1fa8`
- SwapPriceOracle: `0x19ceccd6942ad38562ee10bafd44776ceb67e923`
- PerpEngine: `0x084815d1330ecc3ef94193a19ec222c0c73dff2d`
- MarginVault: `0x82bbaa3b0982d88741b275ae1752db85cafe3c65`
- MarketFactory: `0xfaA7b3a4b5c3f54a934a2e33D34C7bC099f96CCE`
- GoodLendPool: `0xcbeaf3bde82155f56486fb5a1072cb8baaf547cc`
- VaultManager: `0x3489745eff9525ccc3d8c648102fe2cf3485e228`
- gUSD: `0xed12be400a07910e4d4e743e4cee26ab1fc9a961`
- CollateralVault: `0x276c216d241856199a83bf27b2286659e5b877d3`
- SyntheticAssetFactory: `0xfaaddc93baf78e89dcf37ba67943e1be8f37bb8c`
- UBIRevenueTracker: `0xfd6f7a6a5c21a3f503ebae7a473639974379c351`

## Parallel Test Plan

Run lanes independently so one dapp failure does not hide the others:

- Contracts: Foundry build, unit tests, gas report, Slither audit scope.
- Swap: quote, approve, execute, price-impact guard, UBI fee routing.
- Perps: deposit margin, open/close position, liquidation threshold, API market feed.
- Predict: create market, buy/sell outcome, resolve, market detail UI.
- Lend: supply, withdraw, borrow/repay health-factor checks.
- Stable: deposit collateral, mint/repay gUSD, PSM swap, stability pool.
- Stocks: deposit collateral, mint/burn synthetic equity, oracle freshness.
- Portfolio/Claim: wallet states, balances, UBI claim, explorer links.

## Update Cadence

- Group update: every 5 autobuilder commits/iterations via `autobuilder-progress-monitor`.
- This README: regenerate with `python3 scripts/update-testnet-readme.py` before each 5-iteration push/deploy update.
- After deploy: run `bash scripts/health-check.sh` and `bash scripts/verify-onchain-integration.sh`, then regenerate this file.
