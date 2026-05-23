# Lane-7 Internal Smoke — `HEALTH_CONTRACT` Preflight Proof (task 0007g/0013)

_Captured 2026-05-23. Source script:
`scripts/testnet/internal-smoke.sh`. Driver:
`.autobuilder/initiatives/0007g-testnet-setup/proof/run-contract-preflight.sh`._

The smoke now refuses to run without a readable `HEALTH-CONTRACT.md`
file. Previously the path was resolved but never checked; the awk
table-parser at lines ~315-323 leaked
`awk: fatal: cannot open file …` per service to the operator's TTY
*and* yielded an empty `cls`, which fired misleading
`MISSING-FROM-CONTRACT` BLOCKERs for both `oracle-signer` and
`hedge-engine`. The operator chased a phantom misclassification
problem instead of restoring the contract file.

## What changed in `internal-smoke.sh`

Three precise edits, all in the preflight region. The fix is
symmetric with the existing tool / URL / numeric preflights so
operators have one mental model: a missing input → single FATAL
block, exit 2, no half-run report.

```bash
# 1. Respect explicit-empty so `export HEALTH_CONTRACT=""` fails fast
HEALTH_CONTRACT="${HEALTH_CONTRACT-$REPO_ROOT/docs/testnet/HEALTH-CONTRACT.md}"

# 2. Path-existence preflight (after require_uint block, before helpers)
if [[ ! -r "$HEALTH_CONTRACT" ]]; then
  echo "FATAL: HEALTH_CONTRACT not readable at: $HEALTH_CONTRACT" >&2
  echo "FATAL: set HEALTH_CONTRACT=<path> or restore docs/testnet/HEALTH-CONTRACT.md" >&2
  exit 2
fi

# 3. Awk stderr redirection — belt-and-suspenders for garbled file scenarios
cls="$(awk -v s="$svc" '
  ...
' "$HEALTH_CONTRACT" 2>/dev/null)"
```

The `:-` → `-` parameter-expansion swap is observationally different
only when an operator explicitly sets `HEALTH_CONTRACT=""`. Today
that path silently uses the default; after this change it fails
fast with the same FATAL block — which is the right shape because
the operator clearly intended to override.

## Driver output

```
=== Case A: HEALTH_CONTRACT=/nonexistent/path.md ===
exit: 2, elapsed: 22ms
PASS  exit code 2
PASS  FATAL line 1 (not readable)
PASS  FATAL line 2 (set or restore)
PASS  no awk fatal leak
PASS  no Markdown report written
PASS  wallclock 22ms (≤ 500ms)

=== Case B: HEALTH_CONTRACT='' (explicit empty) ===
exit: 2
PASS  exit code 2
PASS  FATAL line 1 (not readable)
PASS  no awk fatal leak

=== Case C: HEALTH_CONTRACT unset (default path) ===
exit: 0
PASS  no FATAL on default path
PASS  Markdown report written
PASS  EXCLUDED row from default contract

=== Case D: HEALTH_CONTRACT points at binary garbage ===
exit: 1
PASS  no awk fatal leak (garbled file)
PASS  no awk fatal leak in stdout
PASS  MISSING-FROM-CONTRACT BLOCKER fires cleanly

ALL CASES PASS
```

## Captured stderr (Case A)

```
FATAL: HEALTH_CONTRACT not readable at: /nonexistent/path.md
FATAL: set HEALTH_CONTRACT=<path> or restore docs/testnet/HEALTH-CONTRACT.md
```

That's the entire stderr — no awk fatals leak through. The smoke
exits before any service probe runs (22 ms wallclock).

## Case D — garbled contract (regression baseline)

A 256-byte random `/dev/urandom` blob points `HEALTH_CONTRACT` at a
file that exists and is readable but contains no contract structure.
The awk pattern matches nothing → empty `cls` → existing
`MISSING-FROM-CONTRACT` BLOCKER fires (the **correct** signal once
the awk stderr is silenced):

```
| `oracle-signer` | health-only | MISSING-FROM-CONTRACT |
| `hedge-engine`  | ok          | MISSING-FROM-CONTRACT |
- BLOCKER: oracle-signer not classified in HEALTH-CONTRACT.md exclusions table
- BLOCKER: hedge-engine not classified in HEALTH-CONTRACT.md exclusions table
```

No `awk:` text in stderr or stdout — the garbled-file diagnostic is
hidden behind the `2>/dev/null` belt-and-suspenders redirect.

## No-regression check

- `proof/run-future-dated.sh` — all four cases still pass.
- `proof/run-env-crlf.sh` — all three cases still pass.
- `proof/run-rpc-timeout.sh` — all three cases still pass.
- `proof/run-input-validation.sh` — preflight regressions clean.
- `proof/run-malformed-url.sh` — preflight regressions clean.

The default-path branch (Case C) covers the existing iter05/iter06
green/red paths transitively — the awk redirection only takes effect
on the read-but-unparseable path, which has no green-path callers.

## Pointers

- Smoke script: [`scripts/testnet/internal-smoke.sh`](../../../scripts/testnet/internal-smoke.sh)
- Driver: [`proof/run-contract-preflight.sh`](./proof/run-contract-preflight.sh)
- PRD: [`tasks/0013-smoke-health-contract-missing-causes-misleading-blockers.md`](./tasks/0013-smoke-health-contract-missing-causes-misleading-blockers.md)
