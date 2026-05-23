# iter16 — internal-smoke .env Markdown injection (task 0007g/0025)

## Summary

The real-trading fence section's four `add_summary` lines
substituted `.env`-sourced `REAL_TRADING_ENABLED` and `ETORO_MODE`
values verbatim into `` `…` `` inline-code spans:

```bash
add_summary "❌ \`REAL_TRADING_ENABLED\` = \`$rte\` — lane-7 forbids real trading"
```

Operator-controlled bytes — backticks (copy-paste from Slack /
1Password / chat), pipes (operator typos), CR/LF (CRLF-edited
.env from Windows or copy-paste from a heredoc) — silently broke
the inline-code span, scrambling the safety-critical fence
section of the report exactly when reviewers stare hardest at
promotion time.

Task 0018 established `escape_md_cell` as the single Markdown-
escape stop for server/operator-controlled bytes that land in
the report. It explicitly scoped out this surface for a later
follow-up ("env-sourced values are a separate surface").
This task closes that scope-out.

## Patch shape

Five-character impact:

```bash
rte="${ENV_PRESENCE[REAL_TRADING_ENABLED]:-unset}"
mode="${ENV_PRESENCE[ETORO_MODE]:-unset}"

# Sanitize for the report's inline-code spans. The raw value stays
# in BLOCKERS[] and the case-match below tests the raw value so
# operators who typo `ETORO_MODE=demo|readonly` still hit the *
# branch and get the BLOCKER they deserve.
rte_md="$(escape_md_cell "$rte")"
mode_md="$(escape_md_cell "$mode")"

if [[ "$rte" == "unset" || "$rte" == "false" ]]; then
  add_summary "✅ \`REAL_TRADING_ENABLED\` = \`$rte_md\` (fence intact)"
else
  add_summary "❌ \`REAL_TRADING_ENABLED\` = \`$rte_md\` — lane-7 forbids real trading"
  BLOCKERS+=("REAL_TRADING_ENABLED is $rte — must be unset or false on the lane-7 host")
fi

case "$mode" in
  mock|demo-readonly|sandbox|demo-trading|unset)
    add_summary "✅ \`ETORO_MODE\` = \`$mode_md\` (within lane-7 allowlist)"
    ;;
  *)
    add_summary "❌ \`ETORO_MODE\` = \`$mode_md\` — lane-7 only allows {mock, demo-readonly, sandbox, demo-trading, unset}"
    BLOCKERS+=("ETORO_MODE is $mode — outside lane-7 allowlist")
    ;;
esac
```

Two new shell variables (`rte_md`, `mode_md`) and four
substitutions. The case-match allowlist and the BLOCKERS[]
console echo deliberately keep the **raw** values — preserving
the byte-faithful terminal echo discipline (task 0018) and
ensuring operators who write `ETORO_MODE=demo|readonly` hit the
`*` BLOCKER branch.

## Acceptance criteria evidence

```
=== Case A: backtick in REAL_TRADING_ENABLED ===
exit: 1
fence line: ❌ `REAL_TRADING_ENABLED` = `foo'echo PWN'bar` — lane-7 forbids real trading
backtick count on fence line: 4 (expect = 4)
PASS  fence line has exactly 4 backticks (2 around key + 2 around value)
PASS  embedded backticks downgraded to apostrophes
PASS  raw value preserved in BLOCKERS[] console echo
PASS  exit 1 (fence BLOCKER fired)

=== Case B: pipe in ETORO_MODE ===
exit: 1
mode line: ❌ `ETORO_MODE` = `demo\|readonly` — lane-7 only allows {...}
PASS  exit 1 (allowlist BLOCKER fired on raw `demo|readonly`)
PASS  pipe escaped as \| inside inline code span
PASS  raw pipe preserved in BLOCKERS[] console echo

=== Case C: mid-value CR in REAL_TRADING_ENABLED ===
exit: 1
fence line: ❌ `REAL_TRADING_ENABLED` = `truefalse` — lane-7 forbids real trading
PASS  no CR (0x0d) in fence line

=== Case D: regression — clean LF .env ===
exit: 0
PASS  fence intact line unchanged
PASS  allowlist line unchanged

ALL CASES PASS
```

## Raw-vs-rendered discipline

Three established invariants this task extends:

1. **Task 0012 (CRLF in env)** — `.env` parsing strips trailing
   CR but preserves the rest verbatim; sanitization at render time.
2. **Task 0018 (status-cell injection)** — `BLOCKERS[]` keeps raw
   value, Markdown cell gets escaped. Operator terminal sees raw
   bytes; report file gets the safe representation.
3. **Task 0021 (diag-row body snippet)** — same composition shape
   applied to the body snippet's inline code span.

This task applies the same pattern to the `REAL_TRADING_ENABLED`
and `ETORO_MODE` fence-line surface — the last operator-controlled
Markdown surface in the smoke report that wasn't routed through
`escape_md_cell`.

## Regression sweep

All 19 proof drivers pass (18 prior + run-env-md-injection.sh).
The clean-LF regression (Case D) confirms the default-path
output is byte-identical to today.

## Runbook update

`docs/testnet/INTERNAL-TESTNET-RUNBOOK.md` extended with a note
in the real-trading-fence step explaining the raw-vs-rendered
discipline (BLOCKERS[] byte-faithful on terminal, Markdown report
routed through `escape_md_cell`).

## Out of scope

- Sanitizing other inline-code spans that substitute non-env
  values (URLs are pre-validated by `PROBE_URL_RE`; addresses
  by the hex-shape regex; LANE7_RPC by the URL regex). None of
  those can carry Markdown-breakers by the time they reach the
  report.
- Promoting `ETORO_MODE=demo|readonly` to a BLOCKER with a typo
  hint ("did you mean demo-readonly?"). The current
  allowlist-miss BLOCKER is the right signal; suggestion text
  is a future UX task.
- Refactoring `escape_md_cell` to a single sed pipeline. The
  current `tr | tr | sed` pipeline runs ~5x per smoke run —
  not the bottleneck.
