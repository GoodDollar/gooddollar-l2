---
id: 0021-smoke-redact-snippet-backtick-breaks-diag-row
title: "internal-smoke.sh: backtick in HTTP_BODY breaks the diag-row's `body[:80]=\\`…\\`` inline code span, splitting the Markdown table cell into prose"
parent: 0007g-testnet-setup
deps: []
split: false
depth: 1
planned: true
executed: true
---

## Problem statement

`scripts/testnet/internal-smoke.sh` emits a body-snippet cell for
every failed probe via `add_diag_row` (lines 318–322):

```bash
add_diag_row() {
  local ct_md
  ct_md="$(escape_md_cell "${HTTP_CT:-?}")"
  add_summary "| ↳ | HTTP ${HTTP_CODE:-000}, content-type $ct_md, curl_exit=${CURL_EXIT:-?} | body[:80]=\`$(redact_snippet "$HTTP_BODY")\` |"
}
```

The body snippet is wrapped in an inline code span — `` `…` `` —
inside a Markdown table cell. `redact_snippet` (lines 275–288)
handles:

- newlines (`tr -d '\n\r'`)
- pipes (`tr '|' '_'`)
- long tokens (`sed` redaction)
- codepoint-safe truncation (`node Array.from(...).slice(0,80)`)

It does **NOT** escape **backticks**. The `escape_md_cell` helper
(line 304) does (it downgrades `` ` `` → `'`), but `redact_snippet`'s
output never passes through it — `add_diag_row` substitutes the
snippet directly between two backticks.

### Observed corruption

A service that returns a body containing backticks — extremely
common in error messages that quote identifiers, file paths, or
code (`"connection refused — see \`docs/runbook.md\`"`, Express
default 500 page `<pre>Error: \`/api/foo\` not found</pre>`,
Node's `AssertionError` stack `(\`actual === expected\`)`) —
produces an unterminated/re-opened inline code span and the rest
of the cell renders as prose.

**Reproduced directly** in the lane-7 worktree
(`bash test_bt.sh` against the live `redact_snippet`):

```
Raw snippet: {"error":"oops `connection refused` see `docs/...`"}
Markdown row that would be written:
| ↳ | HTTP 500, content-type text/plain, curl_exit=0 | body[:80]=`{"error":"oops `connection refused` see `docs/...`"}` |
```

In any GFM renderer this becomes (rough decoding):
- ` `body[:80]=` ` → first code span opener + literal `body[:80]=`
- ` `{"error":"oops ` ` → closes that span / opens new one
- `connection refused` → **rendered as italic prose, not code**
- `` ` see ` `` → opens new span
- `docs/...` → inside span
- `` `"}` `` → closes span + literal `"}`

The 3-cell row visually fragments: column count is preserved (no
`|` injection — `tr '|' '_'` saw to that), but the code-styled
diagnostic snippet operators are trained to skim becomes a mix of
monospace and prose with arbitrary phrases promoted to italic /
bold depending on what punctuation the service emitted. The
operator's eye stops scanning predictably.

### Why this matters

1. **The diag row is the primary failure-diagnosis surface.**
   `add_diag_row` fires on every BLOCKER probe — meaning operators
   look at it precisely when they're 3 AM tired and need to
   distinguish "wrong path" from "wrong port" from "wrong host"
   from "wrong response shape" by glancing at the body snippet.
   Broken inline-code rendering breaks that glance pattern.

2. **The smoke report is a committed artifact.** Once an
   incident-time run lands in `docs/testnet/iter05-internal-smoke.md`
   with a corrupted diag row, the corruption is preserved in git
   forever. Re-running the smoke later overwrites with fresher
   data, but the incident PR / promotion artifact stays broken.

3. **Asymmetry with the already-fixed status cell.** Task 0018
   identified the same class of issue for the status cell
   (`| service | status | classification |`) and routed all
   server-controlled cells through `escape_md_cell`. That fix
   explicitly listed body-snippet escaping as out-of-scope
   ("redact_snippet has its own helper — separate task"). This
   task is that follow-up. The fix shape is the same.

4. **`escape_md_cell` already exists in the script** (lines
   290–309) with backtick handling baked in (`` ` `` → `'`).
   Reusing it is one line of work.

## User story

As a lane-7 operator reading the smoke's diag row at incident
time, I want the body snippet to render as a clean code span
regardless of whether the failing service emitted backticks in
its response, so I can spot the actual failure shape (HTTP code,
content-type, body) at a glance without my Markdown reader
fragmenting the cell into italic / bold prose.

## How it was found

Deep-dive stress-test of `scripts/testnet/internal-smoke.sh`
during product review iteration #5 (most-complex-feature focus
on the lane-7 internal smoke).

A standalone reproduction was driven directly against the live
`redact_snippet` helper extracted from the script (no service
needed — the helper is a pure shell pipeline). Body containing
three backticks reliably produced a fragmented Markdown cell
when rendered in GitHub's preview. The script's own
`escape_md_cell` (line 304, post-task-0018) **already** demonstrates
the right downgrade for backticks (`` ` `` → `'`), but
`redact_snippet` was added in task 0007 (pre-0018) and never
retro-fitted. This is a missed convergence point between the two
helpers.

Adjacent observation (out of scope for this task, noted for
follow-up if it recurs): the `tr '|' '_'` step inside
`redact_snippet` silently rewrites pipes to underscores rather
than escaping them as `\|`. Today's `add_diag_row` callsite is
inside an inline code span, where `\|` would itself render
literally — so the underscore substitution is correct *for that
callsite*. If a future caller emits `redact_snippet`'s output
outside a code span, the underscore rewrite will look like the
service silently dropped pipes. Convergence with
`escape_md_cell` would surface that asymmetry; see "Out of
scope" below.

## Proposed fix

Two equally small variants. Pick the **second** — it requires
zero new helper surface and reuses the post-0018 escape path.

### Variant A: extend `redact_snippet` with a backtick step

Add `tr '\140' "'"` (downgrade `` ` `` → `'`) as the penultimate
stage of the pipeline, before the node truncation:

```bash
redact_snippet() {
  printf '%s' "$1" \
    | tr -d '\n\r' \
    | tr '|' '_' \
    | tr '\140' "'" \
    | sed -E 's#[A-Za-z0-9_+/=-]{20,}#[REDACTED-token]#g' \
    | node -e '
      let raw = "";
      process.stdin.on("data", c => raw += c);
      process.stdin.on("end", () => {
        const chars = Array.from(raw);
        process.stdout.write(chars.slice(0, 80).join(""));
      });
    '
}
```

`tr '\140' "'"` uses octal `\140` for the backtick to avoid
quoting hell inside the shell pipeline (the literal `` ` `` would
otherwise have to be escaped as `\\\``, which is bug-prone). Works
identically on GNU `tr` and BSD `tr`.

Trade-off: `redact_snippet` and `escape_md_cell` now both do
backtick handling — but in slightly different shapes
(`redact_snippet` uses `tr`, `escape_md_cell` uses `sed`).
Acceptable but inconsistent.

### Variant B (preferred): pipe `redact_snippet` output through `escape_md_cell` at the callsite

Change `add_diag_row` (line 318) to:

```bash
add_diag_row() {
  local ct_md body_md
  ct_md="$(escape_md_cell "${HTTP_CT:-?}")"
  body_md="$(escape_md_cell "$(redact_snippet "$HTTP_BODY")")"
  add_summary "| ↳ | HTTP ${HTTP_CODE:-000}, content-type $ct_md, curl_exit=${CURL_EXIT:-?} | body[:80]=\`$body_md\` |"
}
```

Why preferred:

1. **Single source of truth for Markdown escaping.** Every
   server-controlled string that lands in a Markdown table cell
   passes through `escape_md_cell`. No second helper to keep in
   sync with future Markdown gotchas.
2. **`redact_snippet` stays focused on its name.** It redacts
   secrets and truncates length — it doesn't try to know whether
   its output will land in code, prose, JSON, etc.
3. **`tr '|' '_'` inside `redact_snippet` becomes redundant** —
   `escape_md_cell`'s `s/|/\\|/g` would correctly escape pipes
   for table cells. But removing the `tr '|' '_'` is a separate
   cleanup; this task keeps it for safety (escape_md_cell
   double-handling a pipe-free input is a no-op, no regression).
4. **The body cell is the only `redact_snippet` callsite today**
   (`grep -n redact_snippet scripts/testnet/internal-smoke.sh`
   shows definition + one call). Routing it through
   `escape_md_cell` is a one-callsite change.

## Acceptance criteria

1. A service body containing `` ` `` (single backtick) lands in
   the diag row as `'` (apostrophe), not as a literal backtick
   that opens/closes an inline code span.
2. A service body containing `` `error: \`token\` not found` ``
   produces a single, well-formed inline-code span in the diag
   row that renders as monospace end-to-end in GitHub's preview
   (verified by rendering the report and confirming the cell
   is one code span, not three).
3. Reproduce via:
   ```bash
   node -e "
   const http=require('http');
   http.createServer((req,res)=>{
     res.writeHead(500,{'content-type':'application/json'});
     res.end(JSON.stringify({error:'oops \`connection refused\` see \`docs/...\`'}));
   }).listen(49301);" &
   LANE7_BASE='http://localhost' \
     PRICE_SERVICE_URL='http://localhost:49301/health' \
     ORACLE_SIGNER_URL='http://localhost:1/health' \
     HEDGE_ENGINE_URL='http://localhost:1/health' \
     STATUS_AGGREGATOR_URL='http://localhost:1/status.json' \
     REPORT=/tmp/iter05-backtick-proof.md \
     bash scripts/testnet/internal-smoke.sh
   ```
   `grep -F 'body[:80]' /tmp/iter05-backtick-proof.md` shows
   zero literal backticks inside the snippet payload (only the
   two wrapper backticks around `body[:80]=\`…\``).
4. No regression on backtick-free bodies. Existing
   iter05-fixture proofs stay byte-identical modulo timestamps.
5. `escape_md_cell` (or whichever variant ships) is the single
   sanitization stop for the body cell — no duplicate handling
   between `redact_snippet` and the callsite.
6. Other existing test fixtures (UTF-8 emoji body 0020,
   non-JSON body 0007, status-injection body 0018) keep
   producing the same diag-row shape modulo backtick handling
   (verify by re-running each task's proof driver).
7. Proof captured in
   `.autobuilder/initiatives/0007g-testnet-setup/iter12-smoke-backtick-snippet.md`
   with:
   - before/after rendering of the diag row (raw Markdown + a
     rendered screenshot or the rendered HTML),
   - a regression fixture for a backtick-free body,
   - confirmation that no other `redact_snippet` callsite was
     introduced (`rg -F redact_snippet scripts/`).
8. Single commit on the lane-7 branch:
   `0007g/0021: escape backticks in diag-row body snippet`.

## Verification

- Add a proof driver
  `.autobuilder/initiatives/0007g-testnet-setup/proof/run-backtick-snippet.sh`
  that:
  - spawns a tiny HTTP server returning `{"error":"\`a\` \`b\` \`c\`"}`,
  - runs the smoke,
  - greps the report for the `body[:80]=` cell,
  - asserts `awk` count of backticks inside the cell payload
    is **exactly 2** (the two wrappers — not 8).
- Re-run every existing proof driver in
  `.autobuilder/initiatives/0007g-testnet-setup/proof/` and
  confirm each exits 0.
- Render the smoke report on GitHub (or via `pandoc -t html5`)
  for both the broken-fixture and the fixed-fixture and visually
  confirm the cell stays in monospace end-to-end.

## Out of scope

- Removing `tr '|' '_'` from `redact_snippet`. That cleanup
  only makes sense once a non-table caller of `redact_snippet`
  exists; until then it's defensive in depth.
- Escaping `*`, `_`, `~`, `<`, `>` in the body cell. These
  render as literal inside a code span — the issue is purely
  about characters that *break* the span (backticks). If task
  0018-style escaping is later required for non-code-span
  cells, that's a separate convergence.
- Adding backtick handling to the BLOCKERS / WARNINGS console
  echoes (`printf '  BLOCKER: %s\n'`). The console echo does
  not render Markdown — bash printf is byte-faithful, operators
  see the raw value. This task is scoped to the Markdown
  report rendering only.
- Converging `redact_snippet` and `escape_md_cell` into a
  single helper. The two have different responsibilities
  (redact secrets + truncate vs. escape Markdown). Variant B
  composes them at the callsite; that's the right shape.
- Handling escape sequences (`\b`, `\t`, ANSI color codes) in
  the body snippet. Out of scope — these don't break Markdown
  rendering, just look noisy.

---

## Planning

### Overview

The PRD above is fully grounded: it identifies the exact callsite
(`add_diag_row`, line 318–322 of `scripts/testnet/internal-smoke.sh`),
the exact helper to reuse (`escape_md_cell`, lines 290–309), and the
exact one-line patch shape (Variant B — compose at callsite). Verified
against the live script: `escape_md_cell` already downgrades `` ` ``
→ `'`, and `add_diag_row` is the only `redact_snippet` callsite in the
repo (`rg -F redact_snippet scripts/` returns definition + one call).
No new helper is needed; this is a single-line composition change.

### Research notes

- **Existing helper convergence**: `escape_md_cell` (lines 304–309)
  was added by task 0018 and already handles `` ` ``, `|`, `\r`, `\n`.
  Task 0018 explicitly scoped out the body-cell follow-up — this task
  closes that scope-out.
- **`redact_snippet` is the only redactor**, and the body cell is its
  only callsite. Composition at the callsite (Variant B) leaves the
  redactor focused on its name and keeps escape policy in one place.
- **GFM rendering verified**: backticks inside the existing `` `…` ``
  wrapper split the inline-code span; the failure mode is reproducible
  with the standalone driver described in the PRD.
- **No new dependencies**: bash + `tr` + `sed` (already used by both
  helpers).

### Architecture diagram

```mermaid
flowchart LR
    HTTP[HTTP_BODY from probe] --> RS[redact_snippet<br/>strip CRLF, pipe→_,<br/>redact tokens, UTF-8 truncate to 80 chars]
    RS --> EMC[escape_md_cell<br/>backtick→', pipe→\\|, CR drop, LF→space]
    EMC --> ADR[add_diag_row<br/>wraps in `…`<br/>emits Markdown row]
    ADR --> REPORT[(REPORT file)]
    classDef new fill:#cfc,stroke:#080;
    class EMC new
```

Only the green node is new in the data flow; the red node already
exists and is currently bypassed for body cells.

### One-week decision

**YES** — fits in one day, not a week.

Rationale:
- One-line code change at `add_diag_row` (the body-snippet
  composition).
- Proof driver follows the exact pattern of existing drivers in
  `.autobuilder/initiatives/0007g-testnet-setup/proof/` (16 of them,
  same shape: spawn fake HTTP server → run smoke → assert report
  contents).
- Single commit, single fixture, no service-side changes.

### Implementation plan

1. **Patch `scripts/testnet/internal-smoke.sh::add_diag_row`** to wrap
   `redact_snippet "$HTTP_BODY"` in `escape_md_cell` per Variant B.
2. **Write proof driver**
   `.autobuilder/initiatives/0007g-testnet-setup/proof/run-backtick-snippet.sh`
   that spawns a tiny `node http` server returning a JSON body with
   3 embedded backticks, runs the smoke, and asserts `grep -F 'body[:80]='`
   on the report shows exactly two backticks inside the matched line
   (the two `` `…` `` wrappers — not 2 + 6 = 8).
3. **Regression check**: re-run all 16 existing proof drivers, confirm
   each exits 0 and (where applicable) produces byte-identical reports
   modulo timestamps.
4. **Capture proof** in
   `.autobuilder/initiatives/0007g-testnet-setup/iter12-smoke-backtick-snippet.md`
   per PRD §Acceptance #7 (before/after raw Markdown of the diag row,
   regression confirmation, `rg -F redact_snippet scripts/` showing no
   new callsites).
5. **Commit** as `0007g/0021: escape backticks in diag-row body snippet`.

Execution should follow strict TDD per the execute-task skill: write
the proof driver first, observe its failure on the unpatched script
(`exit 1` from the backtick-count assertion), then apply the
one-line patch and observe the driver passing.
