# 100-Iteration Plan

## Operating Cadence

- **Iterations 1–12:** eToro API ingestion, credential safety, and sandbox client.
- **Iterations 13–22:** price service, normalization, freshness and fallback paths.
- **Iterations 23–32:** signer quorum and StockOracleV2.
- **Iterations 33–48:** GoodStocks synthetic token, vault, mint/burn, AMM.
- **Iterations 49–60:** stock perps, funding, margin, liquidations.
- **Iterations 61–72:** stock lending and yield vaults.
- **Iterations 73–84:** UnifiedRiskEngine and ClearingHouse.
- **Iterations 85–92:** off-chain hedge engine and reconciliation.
- **Iterations 93–96:** risk dashboard and admin/kill switches.
- **Iterations 97–100:** frontend release, security regression, final go/no-go.

## Milestones

| Iterations | Milestone | Main Output | Gate |
|---:|---|---|---|
| 1–3 | Secure adapter | Credential loader, eToro client skeleton, quote/instrument normalization | Mocked tests + build |
| 4–8 | Live sandbox data | Confirm endpoint/auth, quote/instrument smoke tests | Non-secret live smoke report |
| 9–12 | Account separation | sandbox/live config split, audit log schema | no real mode without sign-off |
| 13–18 | Price service | REST/WS ingestion, normalized feed, staleness detection | freshness simulation |
| 19–22 | Fallbacks | WS → REST → last-good cache | 99.5% freshness test |
| 23–28 | Oracle quorum | signer service + StockOracleV2 | on-chain price tx proof |
| 29–32 | Signer hardening | 3-of-5 threshold, rotation, deviation alerts | quorum/deviation gate |
| 33–40 | GoodStocks MVP | factory, vault, AMM, mint/trade/burn | full sandbox price E2E |
| 41–48 | GoodStocks liquidity | collateral, liquidity seeding, IL controls | liquidity risk simulation |
| 49–60 | Stock perps | funding, skew, margin, liquidations | open/close/liquidate tests |
| 61–72 | Lend/yield | stock collateral + yield vaults | lend→borrow→repay proof |
| 73–84 | Unified risk | net exposure + clearing house | liquidation cascade simulation |
| 85–92 | Hedge engine | eToro hedge mapping + reconciliation | synthetic long → hedge proof |
| 93–96 | Admin controls | dashboard, kill switches, manual override | halt/unwind drill |
| 97–100 | Release | UI, docs, proof pack, go/no-go | final acceptance gate |

## Execution Rules

```bash
# Per-iteration branch convention
git checkout -b feature/etoro-stocks-iter-N

# Proof path convention
mkdir -p .autobuilder/proof/iter-N
```

Every 10th iteration must run:
- relevant Foundry tests,
- backend tests,
- frontend/E2E smoke where UI is touched,
- oracle divergence simulation,
- hedge reconciliation simulation,
- secret scan / diff inspection.
