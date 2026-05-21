# Tasks: ETORO-001 through ETORO-100

Each task maps one autobuilder iteration to implementation, verification, and proof output.

| ID | Iter | Workstream | Task | Acceptance / proof |
|---|---:|---|---|---|
| ETORO-001 | 1 | A: eToro API ingestion & secrets | Create secure eToro credential loader and redaction helpers. | Credential tests pass; no raw secrets in output. |
| ETORO-002 | 2 | A: eToro API ingestion & secrets | Add configurable eToro client skeleton with injectable fetch and auth headers. | Mock client tests pass. |
| ETORO-003 | 3 | A: eToro API ingestion & secrets | Normalize eToro instruments/quotes into GoodChain oracle-ready price records. | Normalization tests pass; priceE8 verified. |
| ETORO-004 | 4 | A: eToro API ingestion & secrets | Advance eToro API ingestion & secrets: secure credentials, sandbox auth, market data endpoints, order/position sandbox stubs. | Unit/integration proof or explicit blocker note. |
| ETORO-005 | 5 | A: eToro API ingestion & secrets | Documentation refresh for Workstream A: eToro API ingestion & secrets. | README/spec/plan status updated; blockers named. |
| ETORO-006 | 6 | A: eToro API ingestion & secrets | Advance eToro API ingestion & secrets: secure credentials, sandbox auth, market data endpoints, order/position sandbox stubs. | Unit/integration proof or explicit blocker note. |
| ETORO-007 | 7 | A: eToro API ingestion & secrets | Advance eToro API ingestion & secrets: secure credentials, sandbox auth, market data endpoints, order/position sandbox stubs. | Unit/integration proof or explicit blocker note. |
| ETORO-008 | 8 | A: eToro API ingestion & secrets | Advance eToro API ingestion & secrets: secure credentials, sandbox auth, market data endpoints, order/position sandbox stubs. | Unit/integration proof or explicit blocker note. |
| ETORO-009 | 9 | A: eToro API ingestion & secrets | Advance eToro API ingestion & secrets: secure credentials, sandbox auth, market data endpoints, order/position sandbox stubs. | Unit/integration proof or explicit blocker note. |
| ETORO-010 | 10 | A: eToro API ingestion & secrets | Full gate for Workstream A: eToro API ingestion & secrets. | Gate report under `.autobuilder/proof/iter-10/` with tests, screenshots/receipts, blockers. |
| ETORO-011 | 11 | A: eToro API ingestion & secrets | Advance eToro API ingestion & secrets: secure credentials, sandbox auth, market data endpoints, order/position sandbox stubs. | Unit/integration proof or explicit blocker note. |
| ETORO-012 | 12 | A: eToro API ingestion & secrets | Advance eToro API ingestion & secrets: secure credentials, sandbox auth, market data endpoints, order/position sandbox stubs. | Unit/integration proof or explicit blocker note. |
| ETORO-013 | 13 | B: Price service & fallbacks | Advance Price service & fallbacks: REST/WS ingestion, normalization, staleness detection, cache fallback. | Unit/integration proof or explicit blocker note. |
| ETORO-014 | 14 | B: Price service & fallbacks | Advance Price service & fallbacks: REST/WS ingestion, normalization, staleness detection, cache fallback. | Unit/integration proof or explicit blocker note. |
| ETORO-015 | 15 | B: Price service & fallbacks | Documentation refresh for Workstream B: Price service & fallbacks. | README/spec/plan status updated; blockers named. |
| ETORO-016 | 16 | B: Price service & fallbacks | Advance Price service & fallbacks: REST/WS ingestion, normalization, staleness detection, cache fallback. | Unit/integration proof or explicit blocker note. |
| ETORO-017 | 17 | B: Price service & fallbacks | Advance Price service & fallbacks: REST/WS ingestion, normalization, staleness detection, cache fallback. | Unit/integration proof or explicit blocker note. |
| ETORO-018 | 18 | B: Price service & fallbacks | Advance Price service & fallbacks: REST/WS ingestion, normalization, staleness detection, cache fallback. | Unit/integration proof or explicit blocker note. |
| ETORO-019 | 19 | B: Price service & fallbacks | Advance Price service & fallbacks: REST/WS ingestion, normalization, staleness detection, cache fallback. | Unit/integration proof or explicit blocker note. |
| ETORO-020 | 20 | B: Price service & fallbacks | Full gate for Workstream B: Price service & fallbacks. | Gate report under `.autobuilder/proof/iter-20/` with tests, screenshots/receipts, blockers. |
| ETORO-021 | 21 | B: Price service & fallbacks | Advance Price service & fallbacks: REST/WS ingestion, normalization, staleness detection, cache fallback. | Unit/integration proof or explicit blocker note. |
| ETORO-022 | 22 | B: Price service & fallbacks | Advance Price service & fallbacks: REST/WS ingestion, normalization, staleness detection, cache fallback. | Unit/integration proof or explicit blocker note. |
| ETORO-023 | 23 | C: Oracle signer quorum & StockOracleV2 | Advance Oracle signer quorum & StockOracleV2: signer service, quorum contract, oracle updates, deviation alerts. | Unit/integration proof or explicit blocker note. |
| ETORO-024 | 24 | C: Oracle signer quorum & StockOracleV2 | Advance Oracle signer quorum & StockOracleV2: signer service, quorum contract, oracle updates, deviation alerts. | Unit/integration proof or explicit blocker note. |
| ETORO-025 | 25 | C: Oracle signer quorum & StockOracleV2 | Documentation refresh for Workstream C: Oracle signer quorum & StockOracleV2. | README/spec/plan status updated; blockers named. |
| ETORO-026 | 26 | C: Oracle signer quorum & StockOracleV2 | Advance Oracle signer quorum & StockOracleV2: signer service, quorum contract, oracle updates, deviation alerts. | Unit/integration proof or explicit blocker note. |
| ETORO-027 | 27 | C: Oracle signer quorum & StockOracleV2 | Advance Oracle signer quorum & StockOracleV2: signer service, quorum contract, oracle updates, deviation alerts. | Unit/integration proof or explicit blocker note. |
| ETORO-028 | 28 | C: Oracle signer quorum & StockOracleV2 | Advance Oracle signer quorum & StockOracleV2: signer service, quorum contract, oracle updates, deviation alerts. | Unit/integration proof or explicit blocker note. |
| ETORO-029 | 29 | C: Oracle signer quorum & StockOracleV2 | Advance Oracle signer quorum & StockOracleV2: signer service, quorum contract, oracle updates, deviation alerts. | Unit/integration proof or explicit blocker note. |
| ETORO-030 | 30 | C: Oracle signer quorum & StockOracleV2 | Full gate for Workstream C: Oracle signer quorum & StockOracleV2. | Gate report under `.autobuilder/proof/iter-30/` with tests, screenshots/receipts, blockers. |
| ETORO-031 | 31 | C: Oracle signer quorum & StockOracleV2 | Advance Oracle signer quorum & StockOracleV2: signer service, quorum contract, oracle updates, deviation alerts. | Unit/integration proof or explicit blocker note. |
| ETORO-032 | 32 | C: Oracle signer quorum & StockOracleV2 | Advance Oracle signer quorum & StockOracleV2: signer service, quorum contract, oracle updates, deviation alerts. | Unit/integration proof or explicit blocker note. |
| ETORO-033 | 33 | D: GoodStocks synthetic tokens/vault/AMM | Advance GoodStocks synthetic tokens/vault/AMM: asset factory, vault, AMM, mint/burn, liquidity controls. | Unit/integration proof or explicit blocker note. |
| ETORO-034 | 34 | D: GoodStocks synthetic tokens/vault/AMM | Advance GoodStocks synthetic tokens/vault/AMM: asset factory, vault, AMM, mint/burn, liquidity controls. | Unit/integration proof or explicit blocker note. |
| ETORO-035 | 35 | D: GoodStocks synthetic tokens/vault/AMM | Documentation refresh for Workstream D: GoodStocks synthetic tokens/vault/AMM. | README/spec/plan status updated; blockers named. |
| ETORO-036 | 36 | D: GoodStocks synthetic tokens/vault/AMM | Advance GoodStocks synthetic tokens/vault/AMM: asset factory, vault, AMM, mint/burn, liquidity controls. | Unit/integration proof or explicit blocker note. |
| ETORO-037 | 37 | D: GoodStocks synthetic tokens/vault/AMM | Advance GoodStocks synthetic tokens/vault/AMM: asset factory, vault, AMM, mint/burn, liquidity controls. | Unit/integration proof or explicit blocker note. |
| ETORO-038 | 38 | D: GoodStocks synthetic tokens/vault/AMM | Advance GoodStocks synthetic tokens/vault/AMM: asset factory, vault, AMM, mint/burn, liquidity controls. | Unit/integration proof or explicit blocker note. |
| ETORO-039 | 39 | D: GoodStocks synthetic tokens/vault/AMM | Advance GoodStocks synthetic tokens/vault/AMM: asset factory, vault, AMM, mint/burn, liquidity controls. | Unit/integration proof or explicit blocker note. |
| ETORO-040 | 40 | D: GoodStocks synthetic tokens/vault/AMM | Full gate for Workstream D: GoodStocks synthetic tokens/vault/AMM. | Gate report under `.autobuilder/proof/iter-40/` with tests, screenshots/receipts, blockers. |
| ETORO-041 | 41 | D: GoodStocks synthetic tokens/vault/AMM | Advance GoodStocks synthetic tokens/vault/AMM: asset factory, vault, AMM, mint/burn, liquidity controls. | Unit/integration proof or explicit blocker note. |
| ETORO-042 | 42 | D: GoodStocks synthetic tokens/vault/AMM | Advance GoodStocks synthetic tokens/vault/AMM: asset factory, vault, AMM, mint/burn, liquidity controls. | Unit/integration proof or explicit blocker note. |
| ETORO-043 | 43 | D: GoodStocks synthetic tokens/vault/AMM | Advance GoodStocks synthetic tokens/vault/AMM: asset factory, vault, AMM, mint/burn, liquidity controls. | Unit/integration proof or explicit blocker note. |
| ETORO-044 | 44 | D: GoodStocks synthetic tokens/vault/AMM | Advance GoodStocks synthetic tokens/vault/AMM: asset factory, vault, AMM, mint/burn, liquidity controls. | Unit/integration proof or explicit blocker note. |
| ETORO-045 | 45 | D: GoodStocks synthetic tokens/vault/AMM | Documentation refresh for Workstream D: GoodStocks synthetic tokens/vault/AMM. | README/spec/plan status updated; blockers named. |
| ETORO-046 | 46 | D: GoodStocks synthetic tokens/vault/AMM | Advance GoodStocks synthetic tokens/vault/AMM: asset factory, vault, AMM, mint/burn, liquidity controls. | Unit/integration proof or explicit blocker note. |
| ETORO-047 | 47 | D: GoodStocks synthetic tokens/vault/AMM | Advance GoodStocks synthetic tokens/vault/AMM: asset factory, vault, AMM, mint/burn, liquidity controls. | Unit/integration proof or explicit blocker note. |
| ETORO-048 | 48 | D: GoodStocks synthetic tokens/vault/AMM | Advance GoodStocks synthetic tokens/vault/AMM: asset factory, vault, AMM, mint/burn, liquidity controls. | Unit/integration proof or explicit blocker note. |
| ETORO-049 | 49 | E: GoodPerps stock perps | Advance GoodPerps stock perps: funding, skew, margin, liquidation engine. | Unit/integration proof or explicit blocker note. |
| ETORO-050 | 50 | E: GoodPerps stock perps | Full gate for Workstream E: GoodPerps stock perps. | Gate report under `.autobuilder/proof/iter-50/` with tests, screenshots/receipts, blockers. |
| ETORO-051 | 51 | E: GoodPerps stock perps | Advance GoodPerps stock perps: funding, skew, margin, liquidation engine. | Unit/integration proof or explicit blocker note. |
| ETORO-052 | 52 | E: GoodPerps stock perps | Advance GoodPerps stock perps: funding, skew, margin, liquidation engine. | Unit/integration proof or explicit blocker note. |
| ETORO-053 | 53 | E: GoodPerps stock perps | Advance GoodPerps stock perps: funding, skew, margin, liquidation engine. | Unit/integration proof or explicit blocker note. |
| ETORO-054 | 54 | E: GoodPerps stock perps | Advance GoodPerps stock perps: funding, skew, margin, liquidation engine. | Unit/integration proof or explicit blocker note. |
| ETORO-055 | 55 | E: GoodPerps stock perps | Documentation refresh for Workstream E: GoodPerps stock perps. | README/spec/plan status updated; blockers named. |
| ETORO-056 | 56 | E: GoodPerps stock perps | Advance GoodPerps stock perps: funding, skew, margin, liquidation engine. | Unit/integration proof or explicit blocker note. |
| ETORO-057 | 57 | E: GoodPerps stock perps | Advance GoodPerps stock perps: funding, skew, margin, liquidation engine. | Unit/integration proof or explicit blocker note. |
| ETORO-058 | 58 | E: GoodPerps stock perps | Advance GoodPerps stock perps: funding, skew, margin, liquidation engine. | Unit/integration proof or explicit blocker note. |
| ETORO-059 | 59 | E: GoodPerps stock perps | Advance GoodPerps stock perps: funding, skew, margin, liquidation engine. | Unit/integration proof or explicit blocker note. |
| ETORO-060 | 60 | E: GoodPerps stock perps | Full gate for Workstream E: GoodPerps stock perps. | Gate report under `.autobuilder/proof/iter-60/` with tests, screenshots/receipts, blockers. |
| ETORO-061 | 61 | F: GoodLend / GoodYield stocks | Advance GoodLend / GoodYield stocks: stock collateral, yield vaults, cross-protocol borrow. | Unit/integration proof or explicit blocker note. |
| ETORO-062 | 62 | F: GoodLend / GoodYield stocks | Advance GoodLend / GoodYield stocks: stock collateral, yield vaults, cross-protocol borrow. | Unit/integration proof or explicit blocker note. |
| ETORO-063 | 63 | F: GoodLend / GoodYield stocks | Advance GoodLend / GoodYield stocks: stock collateral, yield vaults, cross-protocol borrow. | Unit/integration proof or explicit blocker note. |
| ETORO-064 | 64 | F: GoodLend / GoodYield stocks | Advance GoodLend / GoodYield stocks: stock collateral, yield vaults, cross-protocol borrow. | Unit/integration proof or explicit blocker note. |
| ETORO-065 | 65 | F: GoodLend / GoodYield stocks | Documentation refresh for Workstream F: GoodLend / GoodYield stocks. | README/spec/plan status updated; blockers named. |
| ETORO-066 | 66 | F: GoodLend / GoodYield stocks | Advance GoodLend / GoodYield stocks: stock collateral, yield vaults, cross-protocol borrow. | Unit/integration proof or explicit blocker note. |
| ETORO-067 | 67 | F: GoodLend / GoodYield stocks | Advance GoodLend / GoodYield stocks: stock collateral, yield vaults, cross-protocol borrow. | Unit/integration proof or explicit blocker note. |
| ETORO-068 | 68 | F: GoodLend / GoodYield stocks | Advance GoodLend / GoodYield stocks: stock collateral, yield vaults, cross-protocol borrow. | Unit/integration proof or explicit blocker note. |
| ETORO-069 | 69 | F: GoodLend / GoodYield stocks | Advance GoodLend / GoodYield stocks: stock collateral, yield vaults, cross-protocol borrow. | Unit/integration proof or explicit blocker note. |
| ETORO-070 | 70 | F: GoodLend / GoodYield stocks | Full gate for Workstream F: GoodLend / GoodYield stocks. | Gate report under `.autobuilder/proof/iter-70/` with tests, screenshots/receipts, blockers. |
| ETORO-071 | 71 | F: GoodLend / GoodYield stocks | Advance GoodLend / GoodYield stocks: stock collateral, yield vaults, cross-protocol borrow. | Unit/integration proof or explicit blocker note. |
| ETORO-072 | 72 | F: GoodLend / GoodYield stocks | Advance GoodLend / GoodYield stocks: stock collateral, yield vaults, cross-protocol borrow. | Unit/integration proof or explicit blocker note. |
| ETORO-073 | 73 | G: UnifiedRiskEngine / ClearingHouse | Advance UnifiedRiskEngine / ClearingHouse: net exposure, margin requirements, ADL, dashboard feed. | Unit/integration proof or explicit blocker note. |
| ETORO-074 | 74 | G: UnifiedRiskEngine / ClearingHouse | Advance UnifiedRiskEngine / ClearingHouse: net exposure, margin requirements, ADL, dashboard feed. | Unit/integration proof or explicit blocker note. |
| ETORO-075 | 75 | G: UnifiedRiskEngine / ClearingHouse | Documentation refresh for Workstream G: UnifiedRiskEngine / ClearingHouse. | README/spec/plan status updated; blockers named. |
| ETORO-076 | 76 | G: UnifiedRiskEngine / ClearingHouse | Advance UnifiedRiskEngine / ClearingHouse: net exposure, margin requirements, ADL, dashboard feed. | Unit/integration proof or explicit blocker note. |
| ETORO-077 | 77 | G: UnifiedRiskEngine / ClearingHouse | Advance UnifiedRiskEngine / ClearingHouse: net exposure, margin requirements, ADL, dashboard feed. | Unit/integration proof or explicit blocker note. |
| ETORO-078 | 78 | G: UnifiedRiskEngine / ClearingHouse | Advance UnifiedRiskEngine / ClearingHouse: net exposure, margin requirements, ADL, dashboard feed. | Unit/integration proof or explicit blocker note. |
| ETORO-079 | 79 | G: UnifiedRiskEngine / ClearingHouse | Advance UnifiedRiskEngine / ClearingHouse: net exposure, margin requirements, ADL, dashboard feed. | Unit/integration proof or explicit blocker note. |
| ETORO-080 | 80 | G: UnifiedRiskEngine / ClearingHouse | Full gate for Workstream G: UnifiedRiskEngine / ClearingHouse. | Gate report under `.autobuilder/proof/iter-80/` with tests, screenshots/receipts, blockers. |
| ETORO-081 | 81 | G: UnifiedRiskEngine / ClearingHouse | Advance UnifiedRiskEngine / ClearingHouse: net exposure, margin requirements, ADL, dashboard feed. | Unit/integration proof or explicit blocker note. |
| ETORO-082 | 82 | G: UnifiedRiskEngine / ClearingHouse | Advance UnifiedRiskEngine / ClearingHouse: net exposure, margin requirements, ADL, dashboard feed. | Unit/integration proof or explicit blocker note. |
| ETORO-083 | 83 | G: UnifiedRiskEngine / ClearingHouse | Advance UnifiedRiskEngine / ClearingHouse: net exposure, margin requirements, ADL, dashboard feed. | Unit/integration proof or explicit blocker note. |
| ETORO-084 | 84 | G: UnifiedRiskEngine / ClearingHouse | Advance UnifiedRiskEngine / ClearingHouse: net exposure, margin requirements, ADL, dashboard feed. | Unit/integration proof or explicit blocker note. |
| ETORO-085 | 85 | H: Off-chain hedge engine | Documentation refresh for Workstream H: Off-chain hedge engine. | README/spec/plan status updated; blockers named. |
| ETORO-086 | 86 | H: Off-chain hedge engine | Advance Off-chain hedge engine: delta mapping to eToro orders, reconciliation, alerts. | Unit/integration proof or explicit blocker note. |
| ETORO-087 | 87 | H: Off-chain hedge engine | Advance Off-chain hedge engine: delta mapping to eToro orders, reconciliation, alerts. | Unit/integration proof or explicit blocker note. |
| ETORO-088 | 88 | H: Off-chain hedge engine | Advance Off-chain hedge engine: delta mapping to eToro orders, reconciliation, alerts. | Unit/integration proof or explicit blocker note. |
| ETORO-089 | 89 | H: Off-chain hedge engine | Advance Off-chain hedge engine: delta mapping to eToro orders, reconciliation, alerts. | Unit/integration proof or explicit blocker note. |
| ETORO-090 | 90 | H: Off-chain hedge engine | Full gate for Workstream H: Off-chain hedge engine. | Gate report under `.autobuilder/proof/iter-90/` with tests, screenshots/receipts, blockers. |
| ETORO-091 | 91 | H: Off-chain hedge engine | Advance Off-chain hedge engine: delta mapping to eToro orders, reconciliation, alerts. | Unit/integration proof or explicit blocker note. |
| ETORO-092 | 92 | H: Off-chain hedge engine | Advance Off-chain hedge engine: delta mapping to eToro orders, reconciliation, alerts. | Unit/integration proof or explicit blocker note. |
| ETORO-093 | 93 | I: Risk dashboard / admin controls | Advance Risk dashboard / admin controls: risk UI, heatmaps, kill switches, manual override. | Unit/integration proof or explicit blocker note. |
| ETORO-094 | 94 | I: Risk dashboard / admin controls | Advance Risk dashboard / admin controls: risk UI, heatmaps, kill switches, manual override. | Unit/integration proof or explicit blocker note. |
| ETORO-095 | 95 | I: Risk dashboard / admin controls | Documentation refresh for Workstream I: Risk dashboard / admin controls. | README/spec/plan status updated; blockers named. |
| ETORO-096 | 96 | I: Risk dashboard / admin controls | Advance Risk dashboard / admin controls: risk UI, heatmaps, kill switches, manual override. | Unit/integration proof or explicit blocker note. |
| ETORO-097 | 97 | J: Frontend UX / release | Advance Frontend UX / release: release UI, E2E, security regression, manifest. | Unit/integration proof or explicit blocker note. |
| ETORO-098 | 98 | J: Frontend UX / release | Advance Frontend UX / release: release UI, E2E, security regression, manifest. | Unit/integration proof or explicit blocker note. |
| ETORO-099 | 99 | J: Frontend UX / release | Advance Frontend UX / release: release UI, E2E, security regression, manifest. | Unit/integration proof or explicit blocker note. |
| ETORO-100 | 100 | J: Frontend UX / release | Full gate for Workstream J: Frontend UX / release. | Gate report under `.autobuilder/proof/iter-100/` with tests, screenshots/receipts, blockers. |
