# Spec: GoodChain / eToro Synthetic Stocks

## Product Vision

GoodChain becomes the on-chain synthetic finance layer for eToro-grade real-world equity exposure. Users can trade synthetic stocks, stock perps, lend/yield against stock positions, and view risk transparently on-chain. Net protocol delta is reconciled and hedged off-chain through eToro APIs.

## Primary Users

- **Retail/testnet users:** trade synthetic equity exposure on GoodChain.
- **Liquidity providers:** seed GoodStocks and stock lending/yield vaults.
- **Risk/admin operators:** monitor exposure, prices, hedges, and kill switches.
- **AI agents:** consume normalized prices and execute controlled trading flows.

## Functional Requirements

1. Ingest eToro market data from configurable sandbox/live endpoints.
2. Normalize instruments and quotes to GoodChain canonical format.
3. Convert equity prices to 8-decimal oracle-ready values.
4. Sign and submit multi-source / quorum oracle updates.
5. Mint, burn, and trade synthetic stocks with collateral checks.
6. Support stock perps with funding, margin, skew, and liquidation logic.
7. Support stock collateral in GoodLend and stock yield strategies in GoodYield.
8. Calculate cross-product net exposure in UnifiedRiskEngine.
9. Map net GoodChain exposure to eToro hedge instructions.
10. Reconcile on-chain exposure vs eToro positions and alert on mismatch.
11. Expose dashboard/admin controls for risk, prices, positions, and pause actions.

## Non-Functional Requirements

- Quote normalization latency target: < 200 ms p50 from received quote to canonical record.
- Oracle freshness target: 99.5% of active quotes < 2 seconds stale during market-open tests.
- Price deviation guard: halt symbol if eToro normalized price differs from quorum median by > 0.5%.
- Reconciliation tolerance: final launch gate requires < 0.3% hedge mismatch.
- Uptime target: 99.9% for price signer/oracle services after production hardening.
- Security: no raw secrets in process logs, frontend bundles, GitHub artifacts, or screenshots.

## External Systems

- eToro API: market data, account/positions, sandbox/live trading.
- GoodChain L2: contracts, oracle, explorer, RPC.
- Off-chain keepers: price service, oracle signers, hedge engine, reconciliation workers.
- Dashboard: risk/admin UI.

## Canonical Data Shapes

### Normalized quote

```ts
{
  source: 'etoro',
  instrumentId: string,
  symbol: string,
  goodChainKey: `ETORO:${string}:${string}`,
  bid?: number,
  ask?: number,
  last?: number,
  price: number,
  priceE8: bigint,
  currency: string,
  exchange?: string,
  assetClass: 'equity' | 'etf' | 'crypto' | 'forex' | 'index' | 'commodity' | 'unknown',
  timestamp: number,
  stale: boolean
}
```

### Oracle update

```ts
{
  ticker: string,
  instrumentId: string,
  source: 'etoro',
  priceChainlink: bigint,
  timestamp: number
}
```

## Out of Scope for This SpecKit

- Jurisdiction-specific regulatory approvals.
- Real-money live eToro account usage before explicit sign-off.
- Production market-making strategy optimization.
