# Lane-7 Internal Smoke — Tool Preflight Proof (task 0007g/0009)

_Captured 2026-05-23 against the fake-status-server harness. Source script:
`scripts/testnet/internal-smoke.sh`. Driver:
`.autobuilder/initiatives/0007g-testnet-setup/proof/run-tool-preflight.sh`._

The smoke now preflights `node curl awk date` in a single loop and exits
2 with `FATAL: missing required tool: <name>` on the first missing tool.
Previously only `node` was checked; missing `curl` / `awk` / `date`
silently cascaded into bogus `BLOCKER: ... unreachable` /
`MISSING-FROM-CONTRACT` / always-fresh verdicts.

## Driver output

```
--- case: A: empty PATH (PATH=/nonexistent) ---
exit code: 2
stderr:
FATAL: missing required tool: node
PASS
--- case: B: no curl (PATH=/tmp/...) ---
exit code: 2
stderr:
FATAL: missing required tool: curl
PASS
--- case: C: no awk (PATH=/tmp/...) ---
exit code: 2
stderr:
FATAL: missing required tool: awk
PASS
--- case: D: no date (PATH=/tmp/...) ---
exit code: 2
stderr:
FATAL: missing required tool: date
PASS

ALL CASES PASS
```

## No-regression check

Existing iter05 green + red proof drivers (run against the
`lane7-smoke-green` harness profile and the synthetic
`LANE7_BASE=http://127.0.0.1:1` red harness) produce verdicts
`GREEN-with-warnings` (exit 0) and `RED` (exit 1) — byte-identical
modulo timestamps. The new preflight only fires when a tool is
actually missing, so the default green/red paths are untouched.

## Pointers

- Smoke script: [`scripts/testnet/internal-smoke.sh`](../../../scripts/testnet/internal-smoke.sh)
- Driver: [`proof/run-tool-preflight.sh`](./proof/run-tool-preflight.sh)
- PRD: [`tasks/0009-smoke-missing-curl-and-awk-preflight.md`](./tasks/0009-smoke-missing-curl-and-awk-preflight.md)
