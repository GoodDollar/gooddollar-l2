# GoodChain + eToro — Architecture Overview

## System Components

### Off-Chain Services
| Service | Purpose | Port |
|---------|---------|------|
| `etoro-client` | eToro API SDK (shared library) | — |
| `etoro-price-service` | Normalize eToro quotes, risk filter, broadcast | TBD |
| `oracle-signer` | Sign + submit price batches to StockOracleV2 | — |
| `hedge-engine` | Map net exposure to eToro hedge orders | — |
| `stocks-keeper` | Stock price maintenance (updated for OracleV2) | existing |

### Smart Contracts
| Contract | Purpose | Depends On |
|----------|---------|------------|
| `StockOracleV2` | Canonical stock prices, quorum-signed | — |
| `SyntheticAssetFactory` | Deploy gStock tokens + vaults | StockOracleV2 |
| `SyntheticStockToken` | ERC20 per stock (gAAPL, gTSLA, etc.) | Factory |
| `StockVault` | Collateral vault for mint/burn | StockOracleV2 |
| `StockAMM` | Oracle-anchored AMM per stock pair | StockOracleV2 |
| `StockPerpEngine` | Stock perpetual futures | StockOracleV2 |
| `UnifiedRiskEngine` | Cross-product exposure netting | All products |
| `ClearingHouse` | Margin, auto-deleverage | UnifiedRiskEngine |
| `InsuranceFund` | Bad debt coverage | ClearingHouse |

### Data Flow
```
eToro WebSocket/REST
       │
       ▼
  Price Service (normalize + risk filter)
       │
       ├──► Oracle Signer ──► StockOracleV2 (on-chain)
       │                          │
       │                          ├──► StockAMM
       │                          ├──► StockPerpEngine
       │                          ├──► GoodLend
       │                          └──► GoodYield
       │
       └──► Hedge Engine ◄── UnifiedRiskEngine events
                │
                ▼
           eToro Trading API
```

### Hedging Model
Protocol is economically counterparty to all user positions:
- Users long gAAPL → protocol short → hedge by buying AAPL on eToro
- Users short gAAPL perp → protocol long → hedge by selling AAPL on eToro

Net across all products before hedging:
```
netDelta(AAPL) = spotSupply + ammInventory + perpNetOI + lendBalance + yieldPosition
hedgeNeeded(AAPL) = -netDelta(AAPL) - currentEtoroPosition(AAPL)
```

Only rebalance when |hedgeNeeded| > threshold.

### Market Hours State Machine
```
US_OPEN → PRE_MARKET → AFTER_HOURS → CLOSED → US_OPEN
                                        │
                                   HALTED (anytime)
```

Each state adjusts: spreads, max leverage, margin requirements, mint/burn permissions.

### Fee Structure (All Products)
- 33% of all protocol fees → UBI pool (non-negotiable)
- Stock AMM: 0.30% per trade (0.20% LP, 0.10% UBI)
- Stock Perps: funding spread + liquidation penalties → UBI share
- Stock Lending: borrow interest spread → UBI share
- Synthetic mint/burn: 0.30% → UBI share
