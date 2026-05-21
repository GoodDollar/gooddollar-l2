# Iter36 Price Rebalance Invariant Proof

This artifact codifies and verifies the addendum invariant for two consecutive blocks:

- eToro normalized quote -> StockOracleV2 snapshot block -> AMM/perps/prediction/lend/yield sync state
- No risk-increasing action when any product `lastSyncedBlock(symbol) < current block`
- P0 stop conditions surfaced: divergence >0.5%, stale propagation, secret leakage

## Inputs

- Fixture: `docs/security/iter36/rebalance-fixture.json`
- Proof output: `docs/security/iter36/rebalance-proof.json`
- Validator: `scripts/security/price_rebalance_invariant.mjs`

## Summary

- `AAPL`: pass on blocks 1200 and 1201
- `TSLA`: fail on block 1201 due to stale AMM sync and secret leakage marker
- Stop reasons observed in run: `STALE_PROPAGATION`, `SECRET_LEAKAGE`

## Notes

This proof harness is intentionally repo-local and deterministic so lane-d can validate the invariant without introducing net-new production Solidity.
