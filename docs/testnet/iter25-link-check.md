# Iter 25 — Doc Link Check Artefact

**Runner:** `python3 scripts/check-doc-links.py`
**Captured:** 2026-05-18 (iter 25, README/doc checkpoint 5).
**Result:** `checked=50 broken=0` after the iter 25 doc refresh
landed (the two transient `BROKEN` lines below for
`docs/testnet/iter25-*` resolved as soon as those artefact files
were committed in the same iter 25 doc-refresh task).

## Scope

The link checker walks every README and `docs/*.md` file referenced
from the project README and verifies:

- Local file/anchor links resolve on disk.
- HTTP(S) links return 200 (with a small allow-list of expected
  non-200 endpoints).
- The public RPC at `https://rpc.goodclaw.org` returns the expected
  chain id (`0xa455` = 42069).

## Raw output (final state after iter 25 doc refresh)

```
== README.md ==
  OK     docs/TESTNET-READINESS-50-ITERATIONS.md  (exists)
  OK     docs/ARCHITECTURE.md  (exists)
  OK     docs/TESTNET_README.md  (exists)
  OK     docs/TESTNET_README.md#frontend-health-iter-19  (exists)
  OK     docs/UBI-FEE-ACCOUNTING.md  (exists)
  OK     test/integration/UBIFeeIntegrationProofSwapPerps.t.sol  (exists)
  OK     test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol  (exists)
  OK     docs/testnet/iter25-readme-doc-checkpoint-5.md  (exists)
  OK     docs/testnet/iter25-link-check.md  (exists)
  OK     op-stack/addresses.json  (exists)
  OK     frontend/scripts/atomic-build.mjs  (exists)
  OK     docs/runbooks/frontend-rebuild.md  (exists)
  OK     scripts/testnet/iter14-restore-goodswap.sh  (exists)
  OK     docs/PRODUCTION-ROADMAP-50-ITERATIONS.md  (exists)
  OK     docs/DUNE-DASHBOARD-SPEC.md  (exists)
  OK     docs/SECURITY-AUDIT.md  (exists)
  OK     .autobuilder/integration-results.md  (exists)
  OK     scripts/check-doc-links.py  (exists)
== docs/TESTNET_README.md ==
  OK     https://goodswap.goodclaw.org  (HTTP 200)
  OK     https://goodclaw.org  (HTTP 200)
  OK     https://explorer.goodclaw.org  (HTTP 200)
  OK     https://rpc.goodclaw.org  (rpc-probe HTTP 200 chainId=0xa455)
  OK     https://paperclip.goodclaw.org  (HTTP 200)
  OK     UBI-FEE-ACCOUNTING.md  (exists)
  OK     ../test/integration/UBIFeeIntegrationProofSwapPerps.t.sol  (exists)
  OK     ../test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol  (exists)
  OK     https://goodagent.goodclaw.org  (HTTP 200)
  OK     http://localhost:3100/  (HTTP 200)
  OK     https://cloud.reown.com  (HTTP 200)
== docs/ARCHITECTURE.md ==
  OK     https://goodswap.goodclaw.org  (HTTP 200)
  OK     https://rpc.goodclaw.org  (rpc-probe HTTP 200 chainId=0xa455)
  OK     https://explorer.goodclaw.org  (HTTP 200)
  OK     https://paperclip.goodclaw.org  (HTTP 200)
  OK     ../frontend/src/lib/wagmi.ts  (exists)
  OK     TESTNET_README.md#operator-runbook  (exists)
  OK     ../scripts/refresh-addresses.py  (exists)
  OK     ../scripts/check_no_stale_addresses.py  (exists)
  OK     ../frontend/src/components/AddNetworkButton.tsx  (exists)
  OK     ../frontend/src/components/__tests__/AddNetworkButton.test.tsx  (exists)
  OK     ../frontend/e2e/onboarding.spec.ts  (exists)
  OK     ../frontend/scripts/atomic-build.mjs  (exists)
  OK     runbooks/frontend-rebuild.md  (exists)
  OK     https://goodswap.goodclaw.org/api/status  (HTTP 200)

checked=50 broken=0
```

## Notes

- The two iter25 artefact links (`docs/testnet/iter25-readme-doc-checkpoint-5.md`
  and `docs/testnet/iter25-link-check.md`) were intentionally added
  to README during this checkpoint. They report `BROKEN` while the
  task is mid-execution but resolve to `OK` once the files are
  written — which is the state captured above and committed in
  iter 25.
- Public site, RPC, explorer, and Paperclip endpoints were all
  responsive at time of capture, satisfying the "live links"
  requirement of every checkpoint (README Checkpoint Requirements
  item #2 in the 50-iter plan).
- Full transient capture during the iter 25 doc-refresh task is
  preserved at `/tmp/iter25-link-check.txt` on the build host.
