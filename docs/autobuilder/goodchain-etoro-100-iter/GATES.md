# Gates

## Per-Iteration Gate

- `git diff` reviewed for secrets.
- Unit tests for touched module pass.
- Proof artifact exists or blocker is explicit.
- No unrelated dirty files are overwritten.

## Every 5 Iterations

- Update docs/spec/plan status.
- Refresh risk register.
- Summarize blockers and next decisions.

## Every 10 Iterations

- Backend tests for changed services.
- Foundry tests for changed contracts.
- Frontend/E2E smoke if UI changed.
- Oracle freshness/deviation simulation.
- Hedge reconciliation simulation once hedge engine exists.
- Secret scan / credential redaction check.

## Live eToro Gate

Live eToro usage is blocked until:
1. sandbox endpoint/auth confirmed,
2. non-secret smoke test passes,
3. sandbox order/position reconciliation works,
4. Yoni explicitly approves live mode,
5. `ETORO_REAL_CONFIRMED=true` style hard gate exists.

## Final Gate Iteration 100

- Full protocol and service tests green.
- Dashboard and frontend E2E green.
- Hedge reconciliation error < 0.3% in final simulation.
- Admin kill switch tested.
- Release manifest and proof pack complete.
