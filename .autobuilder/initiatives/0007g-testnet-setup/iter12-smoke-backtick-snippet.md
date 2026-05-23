# iter12 — internal-smoke backtick in diag-row body snippet (task 0007g/0021)

## Summary

`add_diag_row` substituted `redact_snippet "$HTTP_BODY"` directly
into the Markdown inline-code span `body[:80]=\`<snippet>\``.
`redact_snippet` strips CR/LF, downgrades pipes to underscores,
redacts long tokens, and codepoint-truncates to 80 chars — but it
does NOT escape backticks. Any body containing backticks (Express
error pages, Node stack traces, JSON quoting identifiers / file
paths) silently split the snippet's inline code span into
`code` + prose + `code` fragments in any GFM renderer. The
operator scanning the most failure-diagnostic cell at 3 AM saw
arbitrary phrases promoted to italic / bold prose.

Task 0018 already established `escape_md_cell` as the single
Markdown-escape stop for server-controlled bytes that land in a
Markdown table cell (with the body-snippet path explicitly
scoped out as a follow-up). This task closes that scope-out by
composing `escape_md_cell` around `redact_snippet`'s output at
the one callsite (Variant B from the PRD — leaves
`redact_snippet` focused on its name, keeps Markdown escape
policy in one place).

## Patch shape

```bash
add_diag_row() {
  local ct_md body_md
  ct_md="$(escape_md_cell "${HTTP_CT:-?}")"
  body_md="$(escape_md_cell "$(redact_snippet "$HTTP_BODY")")"
  add_summary "| ↳ | HTTP ${HTTP_CODE:-000}, content-type $ct_md, curl_exit=${CURL_EXIT:-?} | body[:80]=\`$body_md\` |"
}
```

## Before/after rendering

**Before** (unpatched, body `{"error":"oops \`connection refused\` see \`docs/runbook.md\`"}`):

```
| ↳ | HTTP 500, content-type application/json, curl_exit=0 | body[:80]=`{"error":"oops `connection refused` see `docs/runbook.md`"}` |
```

Six backticks on the row — three pairs forming overlapping inline
code spans. In GFM the cell renders as monospace + prose +
monospace, with `connection refused` and other phrases mid-
sentence promoted to italic/bold depending on the renderer's
recovery heuristics.

**After** (patched):

```
| ↳ | HTTP 500, content-type application/json, curl_exit=0 | body[:80]=`{"error":"oops 'connection refused' see 'docs/runbook.md'"}` |
```

Exactly two backticks — the two wrappers around the snippet
payload. The embedded backticks have been downgraded to
apostrophes by `escape_md_cell`. The whole snippet renders as
one continuous monospace span end-to-end.

## Acceptance criteria evidence

```
=== Case 1: backtick in body ===
diag line: | ↳ | HTTP 500, content-type application/json, curl_exit=0 | body[:80]=`{"error":"oops 'connection refused' see 'docs/runbook.md'"}` |
backtick count on diag row: 2 (expect = 2)
PASS  diag row has exactly two wrapper backticks
PASS  backtick downgraded to apostrophe in snippet payload

=== Case 2: backtick-free regression ===
plain diag line: | ↳ | HTTP 500, content-type application/json, curl_exit=0 | body[:80]=`{"error":"plain old failure no metachars"}` |
backtick count on plain diag row: 2 (expect = 2)
PASS  backtick-free body renders unchanged

=== Case 3: redact_snippet remains single-callsite ===
redact_snippet definitions: 1 (expect = 1)
redact_snippet callsites:   1 (expect = 1)
PASS  redact_snippet still has one definition + one callsite

ALL CASES PASS
```

## Regression sweep

All 15 proof drivers pass (14 prior + run-backtick-snippet.sh):

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
- run-rpc-timeout.sh PASS
- run-rpc-url-validation.sh PASS
- run-stale-body-leak.sh PASS
- run-tool-preflight.sh PASS
- run-utf8-snippet.sh PASS

## Out of scope

- Removing `tr '|' '_'` from `redact_snippet` (defensive in depth
  until a non-table caller exists).
- Adding backtick handling to the BLOCKERS / WARNINGS console
  echoes (bash printf is byte-faithful; operators see the raw
  value in their terminal).
- Converging `redact_snippet` and `escape_md_cell` into a single
  helper (different responsibilities — redact secrets + truncate
  vs. escape Markdown).
