# GoodDollar L2 Alpha Readiness — Next 50 Iterations

_Last updated: 2026-05-18 UTC. Goal: alpha testnet release candidate._

| Iter | Owner | Upgrade | Proof required |
|---:|---|---|---|
| 1 | infra-rpc-agent | Stop RPC saturation without resetting chain state | public/local RPC blockNumber <1s, connection counts, explorer still resolves known tx |
| 2 | infra-rpc-agent | Harden Blockscout devnet config | backend env diff, no trace/balance timeout storm, tx lookup ok |
| 3 | infra-rpc-agent | Status service triage | `/api/status` component table, fix/restart non-chain services |
| 4 | simulation-agent | Fresh wallet/faucet baseline | new wallet addresses, faucet tx hashes, explorer links |
| 5 | release-manager-agent | Docs checkpoint 1 | README/TESTNET_README/ARCHITECTURE link alpha plan + current blocker status |
| 6 | simulation-agent | Wallet + claim/transfer repeatability | 3-wallet transfer receipts + balances |
| 7 | simulation-agent | Swap live lane repeatability | GDT→USDC and reverse tx hashes + balance deltas |
| 8 | simulation-agent | Predict live lane repeatability | create/buy/portfolio proof or documented admin dependency |
| 9 | simulation-agent | Perps live lane repeatability | deposit/open/close tx hashes + vault balance proof |
| 10 | frontend-qa-agent | Alpha gate 1 | route checks + Playwright public smoke + tx battery summary |
| 11 | simulation-agent | Lend supply/withdraw lane | supply/withdraw tx hashes + reserve state proof |
| 12 | simulation-agent | Stable PSM/mint lane | USDC→gUSD + repay/redeem proof |
| 13 | simulation-agent | Stocks mint/redeem lane | sAAPL mint/redeem tx hashes + position proof |
| 14 | frontend-qa-agent | Portfolio/analytics reflects tx activity | screenshots + API JSON with fresh activity |
| 15 | release-manager-agent | Docs checkpoint 2 | tester checklist updated with all lane tx links |
| 16 | security-hardening-agent | Finish current frontend security changes | tests for EIP155 handler/risk dialog; no TS errors |
| 17 | security-hardening-agent | Dependency audit plan | npm audit output + patched/deferred list |
| 18 | security-hardening-agent | Rate limits/caps verification | faucet/API over-limit tests |
| 19 | security-hardening-agent | Secrets/build artifact scan | grep/build scan proof |
| 20 | frontend-qa-agent | Alpha gate 2 | full route/E2E + health + RPC/explorer proof |
| 21 | infra-rpc-agent | RPC load baseline | k6/autocannon/curl concurrency result + thresholds |
| 22 | infra-rpc-agent | Explorer indexing lag monitor | lag metric/script + runbook |
| 23 | infra-rpc-agent | Faucet drain/runbook drill | dry-run funding/cap report |
| 24 | infra-rpc-agent | Backup/snapshot policy | state artifact list + reset/no-reset decision |
| 25 | release-manager-agent | Docs checkpoint 3 | runbooks linked, reset policy visible |
| 26 | frontend-qa-agent | Mobile alpha pass | 375/768/1440 screenshots for key routes |
| 27 | frontend-qa-agent | Accessibility critical pass | axe critical=0 or accepted-risk list |
| 28 | frontend-qa-agent | Error-state UX pass | invalid addresses/routes/network failure screenshots |
| 29 | frontend-qa-agent | Feedback loop proof | submit feedback with redaction proof |
| 30 | release-manager-agent | Alpha gate 3 | docs + full test/evidence index refreshed |
| 31 | simulation-agent | Multi-wallet scenario | 5 wallets across all apps, tx graph proof |
| 32 | simulation-agent | UBI fee accounting live proof | events/balance deltas for fee splitter |
| 33 | simulation-agent | Bridge/claim boundary proof | explicit live/non-live state + docs |
| 34 | simulation-agent | Agent wallet / AntSeed boundary proof | what works, what is mocked, test tx if live |
| 35 | release-manager-agent | Docs checkpoint 4 | app topology and known limitations refreshed |
| 36 | security-hardening-agent | Slither/Foundry security refresh | current outputs archived |
| 37 | security-hardening-agent | Oracle/cap pause controls | tests/docs proof |
| 38 | security-hardening-agent | WalletConnect/signing safety | unsupported request rejection tests |
| 39 | security-hardening-agent | Incident response checklist | docs/runbooks security page |
| 40 | frontend-qa-agent | Alpha gate 4 | E2E matrix + health + RPC + tx proof |
| 41 | infra-rpc-agent | Deploy/redeploy drill | build ID, PM2 reload, route verification |
| 42 | infra-rpc-agent | Observability dashboard | status/analytics/explorer lag linked |
| 43 | release-manager-agent | External tester invite pack | invite text + checklist + feedback path |
| 44 | release-manager-agent | Release notes draft | `docs/releases/alpha-testnet.md` |
| 45 | release-manager-agent | Docs checkpoint 5 | README GitHub-ready for alpha |
| 46 | all | Full transaction battery final | fresh-wallet tx hashes across all lanes |
| 47 | all | Full contract/backend matrix | Foundry + service integration logs |
| 48 | all | Final visual/accessibility matrix | screenshots + axe report |
| 49 | release-manager-agent | Go/no-go risk classification | must-fix / accepted / deferred list |
| 50 | release-manager-agent | Alpha RC manifest | `docs/alpha/ALPHA-RC-MANIFEST.md` + tag recommendation |
