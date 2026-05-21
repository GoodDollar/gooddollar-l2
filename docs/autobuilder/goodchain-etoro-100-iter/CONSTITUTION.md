# GoodChain / eToro Synthetic Stocks — SpecKit Constitution

**Status:** Finalized for GitHub planning  
**Date:** 2026-05-19  
**Scope:** eToro price ingestion, GoodChain synthetic stocks/perps/lend/yield, unified risk, hedging, admin controls.

## Core Principles

1. **No secrets in git, logs, screenshots, or proof packs.** eToro credentials stay in local secret stores or ignored `.env` files only.
2. **Sandbox first.** Every eToro API call uses sandbox/test credentials until the live switch gate is explicitly approved by Yoni.
3. **Verifiable price path.** Every on-chain synthetic price must be traceable from eToro quote → normalized quote → signed oracle update → on-chain receipt.
4. **UnifiedRiskEngine is source of truth.** Net exposure, collateral, margin, liquidation eligibility, and hedge requirements are calculated from one canonical engine.
5. **Every iteration produces proof.** Tests, tx receipts, screenshots, logs, reconciliation CSV/JSON, or an explicit blocker note live under `.autobuilder/proof/iter-N/`.
6. **P0 stop rule.** Stop the autobuilder loop on oracle divergence > 0.5%, hedge mismatch > 0.5%, stale price propagation, risk miscalculation, or leaked secret.
7. **Market-hours aware.** Equities trading, pricing, margin, and hedging must respect regular session, pre-market, after-hours, closed, and halted states.
8. **Human kill switch.** Admins can pause new positions, halt mint/burn, disable per-symbol trading, and force hedge unwind.
9. **Docs every 5, full gate every 10.** Documentation refreshes every 5 iterations; Foundry/backend/frontend/risk/hedge gates run every 10.
10. **Branch discipline.** Implementation branches use `feature/etoro-stocks-iter-N`; this SpecKit package is the planning source of truth.

## Definition of Done

A milestone is done only when:
- acceptance criteria pass,
- proof artifacts exist,
- no secrets are present in `git diff`,
- docs are updated,
- the next blocker/decision is named.
