# iter13 — internal-smoke REPORT write-failure preflight (task 0007g/0022)

## Summary

`scripts/testnet/internal-smoke.sh` wrote its Markdown report via
two unchecked filesystem operations:

```bash
mkdir -p "$(dirname "$REPORT")"
{ echo "# Lane-7 Internal Smoke Run"; ...; } > "$REPORT"
```

`set -u` catches unset variables but not command failures, and
`set -e` is intentionally off (probes must continue past failures).
Result: if the operator pointed `REPORT` at an unwritable parent,
an existing 0400 file, a directory, or `/dev/full`, the smoke
silently emitted a verdict-grade exit code while no usable file
existed. The console summary still cheerfully printed
`report:    $REPORT`, operators pasted that path into promotion
tickets, and reviewers saw stale (or missing) content. Promotion
fraud by omission.

Asymmetric with the rest of the script's preflight discipline:
tasks 0008, 0009, 0013, 0014, 0015, 0019 all added fail-fast
`FATAL: …` + `exit 2` blocks for malformed inputs. `$REPORT` was
the one remaining unchecked filesystem input.

## Patch shape

Two interventions:

**1. Preflight (after the HEALTH_CONTRACT preflight, ~line 218):**

```bash
REPORT_DIR="$(dirname "$REPORT")"
if ! mkdir -p "$REPORT_DIR" 2>/dev/null; then
  echo "FATAL: cannot create REPORT parent directory: $REPORT_DIR" >&2
  echo "FATAL: set REPORT=<path> or fix the parent permissions" >&2
  exit 2
fi
if [[ -d "$REPORT" ]]; then
  echo "FATAL: REPORT is a directory, not a file: $REPORT" >&2
  echo "FATAL: include a filename, e.g. REPORT=$REPORT/iter05-internal-smoke.md" >&2
  exit 2
fi
if [[ -e "$REPORT" && ! -w "$REPORT" ]]; then
  echo "FATAL: REPORT exists but is not writable: $REPORT" >&2
  exit 2
fi
```

**2. Post-write verification (wrapping the existing report-write block):**

```bash
report_write_ok=1
{
  echo "# Lane-7 Internal Smoke Run"
  ...
} > "$REPORT" || report_write_ok=0

if (( ! report_write_ok )) || [[ ! -s "$REPORT" ]]; then
  echo "FATAL: failed to write smoke report: $REPORT (disk full? mount unavailable?)" >&2
  exit 3
fi
```

**3. Exit-code header** updated to document new codes `2` and `3`.

## Why both stages?

The preflight catches static config errors operators hit most
often (bad path, wrong permission, typo'd `REPORT=<dir>`).
Post-write catches mid-run filesystem failures (disk full, FUSE
unmount, race-deleted parent). The `[[ ! -s "$REPORT" ]]` guard
catches the `/dev/full` case where open-for-write succeeds but
every `echo` returns ENOSPC — bash's `>` returns failure status
in that case, hence the `|| report_write_ok=0` capture.

Exit code `3` distinguishes "verdict computed but artifact
missing" from `{0 = GREEN, 1 = RED, 2 = preflight FATAL}`. Any
CI consumer that grep'd for `exit 1` to detect "smoke RED" stays
correct; "exit 3" is a new, distinguishable signal for a
filesystem-side failure.

## Acceptance criteria evidence

```
=== Case A: REPORT parent unwritable ===
PASS  exit 2 on unwritable parent (exit 2)
PASS  FATAL names parent dir
PASS  no verdict emitted (preflight failed fast)

=== Case B: REPORT is a directory ===
PASS  exit 2 on REPORT=<dir> (exit 2)
PASS  FATAL names directory case

=== Case C: REPORT exists 0400 ===
PASS  exit 2 on 0400 REPORT (exit 2)
PASS  FATAL names readonly case
PASS  existing read-only file not clobbered

=== Case D: REPORT=/dev/full (disk-full mid-write) ===
PASS  exit 3 on /dev/full (exit 3)
PASS  FATAL names mid-write failure

=== Case E: writable temp regression ===
PASS  Case E exit code is verdict-grade (0)
PASS  green report file has content
PASS  green report has expected title

=== Case F: script header documents exit codes 2 and 3 ===
PASS  header documents exit codes 2 and 3

ALL CASES PASS
```

## Regression sweep

All 16 proof drivers pass (15 prior + run-report-write-preflight.sh):

- run-address-validation.sh PASS
- run-backtick-snippet.sh PASS
- run-contract-preflight.sh PASS
- run-env-crlf.sh PASS
- run-future-dated.sh PASS
- run-html-500.sh PASS
- run-input-validation.sh PASS
- run-lane7-base-validation.sh PASS
- run-malformed-url.sh PASS
- run-md-injection.sh PASS
- run-report-write-preflight.sh PASS
- run-rpc-timeout.sh PASS
- run-rpc-url-validation.sh PASS
- run-stale-body-leak.sh PASS
- run-tool-preflight.sh PASS
- run-utf8-snippet.sh PASS

## Out of scope

- Atomic write (`tmp + mv`) semantics — separate hardening task.
- Report rotation — operators have grep patterns pinned to the
  default path.
- A `--report-file -` stdout mode — smoke is write-to-disk by
  design.
- Path-constraint policy (e.g., must be inside repo) — runbook
  concern, not smoke concern.
