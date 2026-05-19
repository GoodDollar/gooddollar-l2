# GoodChain + eToro Synthetic Stocks — 100-Iteration Plan

**Version:** 1.0
**Date:** 2026-05-19
**Repo:** GoodDollar/gooddollar-l2
**Status:** Active

## Vision

GoodChain becomes the on-chain synthetic layer for eToro's real-world equity exposure. Users trade synthetic stocks, stock perps, lend/yield with on-chain liquidity. Protocol hedges net delta off-chain via eToro API. Every market sees the same prices, inventory, and risk limits. 33% of all fees fund UBI.

## Architecture

```
eToro API (market data + trading)
    │
    ▼
┌─────────────────────┐
│   Price Service      │ ← WebSocket + REST + fallback chain
│   (normalize/filter) │
└─────────┬───────────┘
          │
    ▼           ▼
┌──────────┐  ┌──────────────┐
│  Oracle  │  │ Hedge Engine │ ← reads UnifiedRiskEngine events
│  Signer  │  │ (eToro orders)│
└────┬─────┘  └──────────────┘
     │
     ▼
┌──────────────────┐
│  StockOracleV2   │ ← on-chain canonical prices
│  (quorum-signed) │
└────┬─────────────┘
     │
     ├──► GoodStocks AMM (gAAPL/gUSD, gTSLA/gUSD, ...)
     ├──► StockPerpEngine (stock perps, funding, liquidation)
     ├──► GoodLend (stock collateral, utilization curves)
     ├──► GoodYield (stock lending yield vaults)
     │
     ▼
┌──────────────────────────┐
│  UnifiedRiskEngine       │ ← cross-product exposure netting
│  / ClearingHouse         │    per-symbol, protocol-wide
└──────────────────────────┘
```

## 100-Iteration Roadmap

### Phase 1: eToro API Foundation (Iterations 1-12)
**Workstream A: eToro API Client + Secrets**

| Iter | Focus | Artifacts |
|------|-------|-----------|
| 1-2 | SDK scaffold, auth, rate limiter | `backend/etoro-client/` |
| 3-5 | Market data: quotes, instruments, candles | Quote normalization tests |
| 6-8 | Trading: orders, positions, execution | Sandbox order lifecycle |
| 9-12 | Credential separation, audit logging | `docs/etoro-api.md` |

**Gate (iter 10):** Sandbox auth + quotes + order lifecycle + audit log

### Phase 2: Price Pipeline (Iterations 13-32)
**Workstream B: Price Service (13-22)**

| Iter | Focus | Artifacts |
|------|-------|-----------|
| 13-15 | Price service core, WS+REST dual path | `backend/price-service/` |
| 16-18 | Normalization, staleness, deviation | Risk filter tests |
| 19-22 | Fallback chain, last-good cache | 99.5% freshness proof |

**Workstream C: Oracle + Signer (23-32)**

| Iter | Focus | Artifacts |
|------|-------|-----------|
| 23-25 | Multi-signer quorum contract | `src/oracle/StockOracleV2.sol` |
| 26-28 | Off-chain signer service | `backend/oracle-signer/` |
| 29-32 | Quorum config, rotation, deviation alerts | On-chain proof txs |

**Gate (iter 20):** Quote freshness < 2s
**Gate (iter 30):** Oracle update + verification + deviation alert

### Phase 3: Synthetic Stocks (Iterations 33-48)
**Workstream D: GoodStocks Tokens / Vault / AMM**

| Iter | Focus | Artifacts |
|------|-------|-----------|
| 33-36 | SyntheticAssetFactory, per-stock vaults | `src/stocks/SyntheticAssetFactory.sol` |
| 37-40 | Oracle-anchored Stock AMM | `src/stocks/StockAMM.sol` |
| 41-44 | Mint/burn with collateral + oracle checks | Integration tests |
| 45-48 | Liquidity seeding, IL mitigation, market hours | Market-hours state machine |

**Gate (iter 40):** End-to-end mint → trade → burn on live sandbox prices

### Phase 4: Stock Perpetuals (Iterations 49-60)
**Workstream E: StockPerpEngine**

| Iter | Focus | Artifacts |
|------|-------|-----------|
| 49-52 | StockPerpEngine contract | `src/perps/StockPerpEngine.sol` |
| 53-56 | Funding rate + skew for equities | Funding accrual tests |
| 57-60 | Liquidation engine, partial liquidation | Liquidation proof txs |

**Gate (iter 50):** Open/close long/short with correct PnL
**Gate (iter 60):** Forced liquidation + partial liquidation + InsuranceFund routing

### Phase 5: Lending & Yield (Iterations 61-72)
**Workstream F: GoodLend/Yield Stock Products**

| Iter | Focus | Artifacts |
|------|-------|-----------|
| 61-65 | Stock collateral in GoodLend | Utilization curve tests |
| 66-69 | Yield vaults for synthetic stock lending | `src/yield/StockYieldVault.sol` |
| 70-72 | Cross-protocol borrow, volatility haircuts | Integration proof |

**Gate (iter 70):** Lend stock → borrow G$ → repay with yield

### Phase 6: Risk Engine (Iterations 73-84)
**Workstream G: UnifiedRiskEngine / ClearingHouse**

| Iter | Focus | Artifacts |
|------|-------|-----------|
| 73-76 | Net exposure calculator, all products | `src/risk/UnifiedRiskEngine.sol` |
| 77-80 | ClearingHouse, margin, auto-deleverage | `src/risk/ClearingHouse.sol` |
| 81-84 | Risk dashboard data feed, real-time | `/api/risk/exposure` endpoint |

**Gate (iter 80):** Multi-product netting + liquidation cascade simulation

### Phase 7: Hedge Engine (Iterations 85-92)
**Workstream H: Off-Chain Hedge**

| Iter | Focus | Artifacts |
|------|-------|-----------|
| 85-88 | Hedge engine: exposure → eToro orders | `backend/hedge-engine/` |
| 89-92 | Reconciliation, alerting, kill switch | Hedge proof (both sides) |

**Gate (iter 90):** Open synthetic long → eToro offset → proof of both

### Phase 8: Admin + Release (Iterations 93-100)
**Workstream I: Risk Dashboard + Controls (93-96)**
- Admin UI: risk metrics, heatmaps, kill switches
- Emergency pause + manual hedge override
- Circuit breakers

**Workstream J: Frontend + Docs + Release (97-100)**
- Update all frontend pages for live stock data
- Release docs, testnet guide, alpha invite
- Full 100-iteration release manifest
- Security review + production readiness

**Gate (iter 100):** RELEASE-MANIFEST.md with go/no-go

## Operating Rules

1. Fix blockers before adding features
2. Every iteration produces proof
3. Every 5 iterations: docs refresh
4. Every 10 iterations: full gate
5. No API keys in git/logs
6. Sandbox-first until iter 40
7. P0 stop on oracle divergence > 0.5%

## eToro API Requirements

Confirmed needed from eToro:
- Market data API (quotes, instruments, candles, market hours)
- Trading API (orders, positions, execution reports)
- Account API (balances, margin, PnL)
- Sandbox + production environments
- WebSocket streaming (if available)
- Rate limits documentation
- IP whitelist setup
