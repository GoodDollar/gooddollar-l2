# GoodLend — Lending & Borrowing

## Routes

| Route | Purpose |
|-------|---------|
| `/lend` | Supply, borrow, and liquidation UX |

**Live:** https://goodswap.goodclaw.org/lend

## Purpose

Aave-style lending pool: supply assets, borrow against collateral, flash loans, and liquidation flows with UBI fee integration.

## On-chain contracts

| Contract | Source path |
|----------|-------------|
| `GoodLendPool` | `src/lending/GoodLendPool.sol` |
| `GoodLendToken` / `DebtToken` | `src/lending/` |
| `InterestRateModel` | `src/lending/InterestRateModel.sol` |
| `SimplePriceOracle` | `src/lending/SimplePriceOracle.sol` |
| `GoodLendAddressesProvider` | `src/lending/GoodLendAddressesProvider.sol` |

**Known boundary:** `SimplePriceOracle` is admin-set with **no on-chain staleness guard** on devnet — see [`docs/security/iter35-oracle-risk-controls.md`](../security/iter35-oracle-risk-controls.md).

Some gToken/debt token addresses in `devnet.ts` are tagged STALE — verify on-chain.

## Backend services

| Service | Role |
|---------|------|
| `liquidator` | Lending liquidation automation |
| `harvest-keeper` | Yield/harvest related to lend vaults |

## Frontend source

- `frontend/src/app/(app)/lend/page.tsx`

## Tests & evidence

- E2E registry: `lend` in [`e2eRegistry.json`](../../frontend/src/lib/tests/e2eRegistry.json)
- Foundry: `test/GoodLend.t.sol`, UBI proof route 8
- Lane script: `./scripts/run-dapp-lane.sh lend`
- **Public-app lane proof:** deferred to post-iter-19 (see [`docs/TESTNET_README.md`](../TESTNET_README.md)) — UBI routing is integration-proven even when UI lane proof is deferred.

## UBI fee routing

Reserve factor / interest spread — route 8 in [`docs/UBI-FEE-ACCOUNTING.md`](../UBI-FEE-ACCOUNTING.md).

## Status (2026-05-22)

Public HTTP **200**. Full public-app journey E2E for lend: **deferred** per testnet readiness doc; on-chain UBI path: **integration proven**.
