# Risk Register

| Risk | Impact | Likelihood | Mitigation | Stop Gate |
|---|---|---:|---|---|
| eToro endpoint/auth mismatch | Blocks live ingestion | High until confirmed | Keep client paths configurable; mocked adapter tests first | No live smoke without confirmed endpoints |
| Secret leakage | Critical | Medium | redaction helpers, ignored env files, diff/secret scan before commit | Any raw credential in git/logs stops work |
| Stale equity price reaches oracle | Critical | Medium | staleness checks, market-hours state, signer refuses stale payloads | stale quote propagation |
| Oracle divergence > 0.5% | Critical | Medium | quorum, multi-source fallback, deviation halt | divergence > 0.5% |
| Hedge mismatch | High | Medium | reconciliation loop, alerting, manual override | mismatch > 0.5%, final < 0.3% |
| Market closed/halted behavior wrong | High | Medium | session-state engine and conservative haircuts | trading while symbol halted |
| Risk engine miscalculates net exposure | Critical | Medium | deterministic simulation suite, invariant tests | exposure mismatch |
| Liquidity/AMM losses | High | Medium | caps, spreads, insurance fund, staged limits | OI/capital limit breach |
| Regulatory/compliance gap | Critical | Unknown | sandbox only until legal/compliance review | no real launch without approval |
