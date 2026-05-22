# Perps on-chain position diagnosis — lane report (2026-05-22)

## Verdict

**FAIL** (RC E2E blocker remains until devnet contract fix). Frontend/indexing bugs were fixed in this lane; they do not unblock the gate alone.

## Root cause (proved)

### Primary — deployed MarginVault collateral has no code

| Field | Value |
|-------|--------|
| `MarginVault` | `0xbec49fa140acaa83533fb00a2bb19bddd0290f25` |
| `MarginVault.collateral()` | `0x36C02dA8a0983159322a80FFE9F24b1acfF8B570` |
| Bytecode at collateral | **empty** (local `127.0.0.1:8545` and `https://rpc.goodclaw.org`) |
| `op-stack/addresses.json` `GoodDollarToken` | `0x5fbdb2315678afecb367f032d93f642f64180aa3` (has code; tester balance ≈ 9.99e26) |

`DeployPerps.s.sol` defaults `GD_TOKEN` to `0x36C02dA8…`, which matches the live vault wiring. The frontend was approving/depositing `GoodDollarToken` (`0x5fbdb…`), so `MarginVault.deposit()` always reverts (`TransferFailed`). `PerpEngine.openPosition()` then reverts `InsufficientMargin`.

Manual repro (Anvil account #0):

```bash
cast call 0xbec49fa140acaa83533fb00a2bb19bddd0290f25 "collateral()(address)" --rpc-url http://127.0.0.1:8545
# → 0x36C02dA8a0983159322a80FFE9F24b1acfF8B570
cast code 0x36C02dA8a0983159322a80FFE9F24b1acfF8B570 --rpc-url http://127.0.0.1:8545
# → 0x (no code)
cast send 0xbec49fa140acaa83533fb00a2bb19bddd0290f25 "deposit(uint256)" 850925000000000000000 \
  --rpc-url http://127.0.0.1:8545 --private-key 0xac09...
# → execution reverted
```

### Secondary — market index / metadata drift (fixed in this lane)

On-chain `DeployPerps` seeds **BTC = market 0**, **ETH = market 1** (`cast call markets(0)` key = `keccak256("BTC")`). `MARKET_META` / `MARKET_ORACLE_KEYS` had ETH/BTC swapped, so `pairs.findIndex('BTC-USD')` could submit `openPosition` on the wrong market when live pairs loaded.

### Tertiary — false-positive “Order Placed!” (fixed in this lane)

`useOpenPosition` set `phase: 'done'` immediately after `writeContractAsync` without waiting for receipts, so the UI could show success while deposit/open txs reverted on-chain. Now waits for `waitForTransactionReceipt` and surfaces `error` on revert.

## What is NOT the blocker

- **E2E server / Playwright host** — fixed on coordinator branch (`127.0.0.1`, no stale server reuse).
- **RPC split for reads** — browser `/api/rpc` and E2E `publicClient` (`127.0.0.1:8545`) both see the same chain id `42069` and identical `PerpEngine` / position state at diagnosis time.
- **`readOpenTesterPositions()` helper** — tuple indices match ABI (`isOpen` = `[0]`, `size` = `[2]`); loops all `marketCount` markets correctly.

## Files changed

- `frontend/src/lib/usePerps.ts` — vault `collateral()` for approve target; wait for tx receipts
- `frontend/src/lib/useOnChainPerps.ts` — correct `MARKET_META`; `marketId` on pairs; position reads by `marketId`
- `frontend/src/lib/usePerpsHistory.ts` — correct `MARKET_ORACLE_KEYS`
- `frontend/src/lib/perpsData.ts` — `PerpPair.marketId`
- `frontend/src/lib/abi.ts` — `MarginVaultABI.collateral`
- `frontend/src/app/(app)/perps/page.tsx` — use `pair.marketId` for submits
- `frontend/src/lib/__tests__/usePerpsHistory.test.ts` — comment alignment
- `docs/perps-onchain-diagnosis-report.md` — this report

## Recommendation for coordinator

1. **Redeploy GoodPerps** on devnet with `GD_TOKEN=0x5fbdb2315678afecb367f032d93f642f64180aa3` (canonical `GoodDollarToken` from `op-stack/addresses.json`), or redeploy only `MarginVault` + rewire `PerpEngine` if a migration script exists.
2. Run `scripts/refresh-addresses.py` after deploy; verify `cast code $(cast call $VAULT collateral())` is non-empty.
3. Merge this lane’s frontend fixes (market ids + receipt wait + collateral read) before re-running the full perps E2E gate.
4. Do **not** weaken `readOpenTesterPositions()` polling; it correctly detects the missing on-chain position.

## Verification commands (this lane)

| Command | Result |
|---------|--------|
| `git diff --check` | PASS |
| `forge test --match-contract GoodPerps` | PASS (40/40) |
| `cd frontend && npx vitest run src/lib/__tests__/usePerpsHistory.test.ts` | PASS (6/6) |
| `cd frontend && npm run build:e2e:force` | PASS |
| `cd frontend && E2E_PROD_SERVER=1 npx playwright test e2e/perps-journey.spec.ts --project=chromium` | **19 passed, 1 failed** |

Full on-chain flow failure after fixes (expected until vault redeploy):

- No longer reaches false `Order Placed!`; UI shows **`Transaction reverted on-chain`** (deposit/approve path uses dead `MarginVault.collateral()`).
- Assertion: `getByText('Order Placed!')` timed out at 90s (correct strict behavior).
