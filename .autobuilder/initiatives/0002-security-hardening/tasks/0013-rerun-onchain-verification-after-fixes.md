---
id: rerun-onchain-verification-after-fixes
title: "Re-run on-chain integration verification and refresh integration-results.md"
parent: security-hardening-root
deps: [fix-ubifeesplitter-good-dollar-binding, reseed-goodswap-pools, redeploy-goodperps-against-current-gdt]
split: false
depth: 1
planned: true
executed: true
---

## Context

After tasks 0010-0012 fix the three concrete integration gaps
(UBIFeeSplitter binding, GoodSwap pools, GoodPerps vault/engine
redeploy), `integration-results.md` must be regenerated end-to-end so
the source of truth for the initiative reflects the new state. The
acceptance criteria of this initiative include:

> 3. Real on-chain transactions executed across all 6 protocols
> 4. UBI 20% fee routing verified end-to-end

This task is the final assertion that the work in 0010-0012 actually
moved the needle, and produces the receipts the initiative DoD
requires.

## Acceptance Criteria

1. `scripts/verify-onchain-integration.sh` runs to completion against
   devnet without scripting errors (no shell-level reverts, no missing
   env vars).
2. `integration-results.md` is regenerated and shows:
   - **UBI Fee Splitter**: GoodDollar binding == current GDT
     (`0x8f86…`).
   - **GoodSwap**: PASS — real swap executed; tx hash recorded; UBI
     fees increased by ≥ 20% of swap fee.
   - **GoodPerps**: PASS — deposit + openPosition succeeded; tx
     hashes recorded.
   - **GoodPredict**: PASS (already passing — re-confirm).
   - **GoodLend / GoodStable / GoodStocks**: stay documented as
     deferred with explicit reason and next-iteration follow-up
     tasks.
3. UBI accumulated-fees delta after each successful transaction is
   captured in the report (not just the final value).
4. Per-protocol JSON receipts saved under
   `.autobuilder/integration-receipts/<Protocol>.json`. Existing
   receipts may be overwritten.
5. A short "Iteration 3 summary" section appended to the top of
   `integration-results.md` listing what changed since the last run
   and which gaps remain (≤ 15 lines).
6. `forge test` still passes (no contract source changes were made
   since task 0008's hardening).

## Implementation Notes

- This task is intentionally a **scripted re-run**, not new
  development. Only allowed code edits are:
  - Updates to `scripts/verify-onchain-integration.sh` *if* the script
    encounters a previously unknown failure mode that requires a
    one-line fix to keep the report valid (e.g. a GoodLend revert
    error message that needs to be captured rather than crash the
    script). Anything more substantial → defer to a new task.
  - The new "Iteration 3 summary" header in
    `integration-results.md`.
- `addresses.env` is the single source of truth. The script must
  `source` it at the top so any env drift from tasks 0010-0012 is
  picked up automatically.
- Do NOT re-run `forge script` deploy commands here — those belong to
  tasks 0010-0012. This task only assembles their effects.

## Verification

```bash
cd /home/goodclaw/gooddollar-l2

# 1. Sanity: addresses.env reflects post-task-0012 state.
grep -E "^(GDT|VAULT|PERP|FEE_SPLITTER|SWAP)=" .autobuilder/addresses.env

# 2. Run the verification script.
bash scripts/verify-onchain-integration.sh \
  | tee /tmp/integration-rerun.log

# 3. Check the report has been updated.
head -40 .autobuilder/initiatives/0002-security-hardening/integration-results.md

# 4. Each PASS row should have a tx hash.
grep -E "^\| (GoodSwap|GoodPerps|GoodPredict)" \
  .autobuilder/initiatives/0002-security-hardening/integration-results.md

# 5. UBI delta sanity-check (manual cast call).
cast call $FEE_SPLITTER "accumulated()(uint256)" --rpc-url $RPC

# 6. Tests still pass.
forge test
```

## Planning (Step 2)

### Research

The current `scripts/verify-onchain-integration.sh` (read in earlier
diagnosis) does:
1. `source` addresses.env.
2. For each protocol: pre-flight reads → action `cast send` →
   post-state read → write a row to `integration-results.md`.
3. UBI accumulated-fees check before/after each protocol section.
The bug surfaced in this iteration (`collateralToken()` →
`collateral()`) is fixed by task 0012. After task 0010 the splitter
points at the live GDT, so the UBI check loop will now find balances
on the right token. After task 0011, the GoodSwap section's pool
lookup will succeed.

### Architecture diagram

```
addresses.env (post tasks 0010-0012)
        │
        ▼
verify-onchain-integration.sh
        │
        ├── UBI splitter check ──► report row + delta
        ├── GoodSwap            ──► swap → UBI delta → report row
        ├── GoodPerps           ──► deposit → openPosition → report row
        ├── GoodLend            ──► supply (still expected to revert) → row
        ├── GoodStable          ──► partial → row
        ├── GoodStocks          ──► partial → row
        └── GoodPredict         ──► createMarket → row
                                   │
                                   ▼
                  integration-results.md (regenerated)
                                   │
                                   ▼
                .autobuilder/integration-receipts/*.json
```

### One-week decision

YES. ~15 min:
- 5 min: run script.
- 5 min: hand-verify report and add iteration-3 summary header.
- 5 min: forge test.

### Split

No.

### Implementation steps (for execute-task)

1. **Pre-flight:** confirm tasks 0010-0012 are merged and
   `addresses.env` has been refreshed.

2. **Run script:**
   ```bash
   bash scripts/verify-onchain-integration.sh \
     | tee /tmp/integration-rerun.log
   ```
   If it crashes mid-run, capture the exact failing line, apply a
   one-line guard (e.g. `|| true` around a known revert with a
   logged reason), and re-run. Otherwise leave the script alone.

3. **Append iteration-3 summary** to the top of
   `integration-results.md`:
   ```markdown
   ## Iteration 3 — 2026-05-15

   - Reconfigured `UBIFeeSplitter` to bind to current GDT (task 0010).
   - Re-seeded GoodSwap GDT/WETH and GDT/USDC pools (task 0011).
   - Redeployed `MarginVault` + `PerpEngine` against current GDT
     and corrected `verify-onchain-integration.sh` collateral
     getter (task 0012).
   - Result: GoodSwap, GoodPerps, GoodPredict all PASS with real
     on-chain receipts. GoodLend/GoodStable/GoodStocks still need
     reserve/PSM/listing setup respectively — tracked for the next
     iteration.
   ```

4. **forge test** to confirm no regression.

5. **Commit:**
   `chore(integration): re-run on-chain verification after iteration 3 fixes`

   Files staged:
   - `.autobuilder/initiatives/0002-security-hardening/integration-results.md`
   - `.autobuilder/integration-receipts/*.json` (any updated)
   - `scripts/verify-onchain-integration.sh` (only if a defensive
     one-liner was needed)
