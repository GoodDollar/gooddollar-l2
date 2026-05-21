# Iter36 Rebalance Drift Dashboard Proof

This report packages the drift dashboard evidence required by the 2026-05-21 addendum.

## Inputs

- Invariant proof input: `docs/security/iter36/rebalance-proof.json`
- Generator: `scripts/security/generate_rebalance_drift_dashboard.mjs`

## Outputs

- Dashboard markdown: `docs/security/iter36/rebalance-drift-dashboard.md`
- Dashboard summary JSON: `docs/security/iter36/rebalance-drift-summary.json`

## P0 stop rule check

- Divergence > 0.5%: clear in this fixture run
- Stale propagation: triggered (`TSLA`, stale `amm` sync on block 1201)
- Secret leakage: triggered (`TSLA` debug log marker)

The dashboard is intentionally deterministic and generated from repository fixtures to keep verification reproducible in lane d.
