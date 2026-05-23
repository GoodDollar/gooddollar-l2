# Lane-7 Internal Smoke — Numeric Input Validation Proof (task 0007g/0008)

_Captured 2026-05-23. Source script:
`scripts/testnet/internal-smoke.sh`. Driver:
`.autobuilder/initiatives/0007g-testnet-setup/proof/run-input-validation.sh`._

`STALENESS_THRESHOLD_S` and the four `*_PORT` overrides are now
preflighted by a single `require_uint` helper that exits 2 with a
clear FATAL line on:

- non-digit values (e.g. systemd-style `10m`),
- empty strings (treated as missing input rather than silently
  defaulting),
- out-of-range port values (`<1` or `>65535`).

Previously the script let `STALENESS_THRESHOLD_S=10m` through and
raised a raw bash arithmetic error
(`((: 10m: value too great for base ...`) mid-run, while still
writing a misleading verdict because the error didn't abort the
script.

## Driver output

```
--- case: A: STALENESS_THRESHOLD_S=10m ---
exit code: 2
stderr:
FATAL: STALENESS_THRESHOLD_S='10m' must be a non-negative integer (seconds)
PASS
--- case: B: STALENESS_THRESHOLD_S='' ---
exit code: 2
stderr:
FATAL: STALENESS_THRESHOLD_S='' must be a non-negative integer (seconds)
PASS
--- case: C: PRICE_SERVICE_PORT=99999 ---
exit code: 2
stderr:
FATAL: PRICE_SERVICE_PORT='99999' out of range [1, 65535]
PASS
--- case: D: STALENESS_THRESHOLD_S=0 (boundary) ---
exit code: 1
PASS (preflight accepted; downstream rc=1)
```

Case D confirms the boundary value `0` (a legal "any age is stale"
config) passes preflight and the script proceeds normally; the
non-zero exit comes from the unbound port probes downstream, which
is the expected behaviour for that input combination.

## No-regression check

The default-path proofs (iter05 green + iter05 red) re-run cleanly
against the existing harness — verdicts `GREEN-with-warnings`
(exit 0) and `RED` (exit 1) unchanged. The preflight only fires on
bad input; the default-value path is untouched.

## Pointers

- Smoke script: [`scripts/testnet/internal-smoke.sh`](../../../scripts/testnet/internal-smoke.sh)
- Driver: [`proof/run-input-validation.sh`](./proof/run-input-validation.sh)
- Runbook section: [`docs/testnet/INTERNAL-TESTNET-RUNBOOK.md`](../../../docs/testnet/INTERNAL-TESTNET-RUNBOOK.md) (Smoke → "Smoke env contract")
- PRD: [`tasks/0008-smoke-staleness-threshold-input-not-validated.md`](./tasks/0008-smoke-staleness-threshold-input-not-validated.md)
