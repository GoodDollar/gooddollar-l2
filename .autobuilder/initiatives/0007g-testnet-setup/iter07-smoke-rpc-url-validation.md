# Lane-7 Internal Smoke — `LANE7_RPC` URL Preflight Proof (task 0007g/0015)

_Captured 2026-05-23. Source script:
`scripts/testnet/internal-smoke.sh`. Driver:
`.autobuilder/initiatives/0007g-testnet-setup/proof/run-rpc-url-validation.sh`._

The smoke now refuses to spawn the on-chain freshness probe with a
malformed `LANE7_RPC`. The four lane-local probe URLs already had a
preflight regex check; `LANE7_RPC` was the asymmetric exception. A
malformed value (`foo`, `tcp://...`, `http://localhost:8545 ` with
trailing space, `http://localhost:8545\r` from a CRLF .env) made
`new URL(...)` throw synchronously inside the node child; stderr
was redirected to `/dev/null`, stdout empty defaulted to `"0"`, and
the operator saw the misleading
`fresh oracle absent (testnet candidate phase)` WARN — exactly the
message they expect during a pre-deploy testnet, so they took no
action while the actual problem was a typo in the RPC URL.

## What changed in `internal-smoke.sh`

Three coordinated edits:

1. **Keep `PROBE_URL_RE` in scope** past the probe-URL preflight loop
   so the new check can reuse it (single source of truth: every URL
   the smoke consumes is validated by the same regex). The `unset`
   moves below the new check; one comment explains the precedent
   for any future URL input.

2. **New URL preflight after `LANE7_RPC` resolution**:

   ```bash
   if [[ -n "$LANE7_RPC" ]] && [[ ! "$LANE7_RPC" =~ $PROBE_URL_RE ]]; then
     redacted_rpc="${LANE7_RPC%%\?*}"
     echo "FATAL: malformed LANE7_RPC — must match http(s)://host[:port][/path]" >&2
     echo "FATAL: LANE7_RPC=$redacted_rpc" >&2
     exit 2
   fi
   ```

   Empty/unset path is preserved (existing `[[ -z "$LANE7_RPC" ]]`
   skip-with-WARN still fires). The `${LANE7_RPC%%\?*}` redaction
   strips any `?key=...` query string from the FATAL echo so a
   hosted-RPC API key does not leak to the operator's terminal
   during the most likely incident-time error path.

3. **Node-side BADURL sentinel + bash branch** — belt-and-suspenders
   for inputs that match the regex but throw inside `new URL`
   (locale-specific host classes, weird IPv6 literals, anything
   future):

   ```js
   let url;
   try { url = new URL(process.argv[1]); }
   catch (_) { console.log("BADURL"); process.exit(0); }
   ```

   Bash side adds one new branch alongside the existing
   `TIMEOUT` case (added by 0010), so the operator gets a
   `WARN: LANE7_RPC failed URL parsing` line instead of the
   misleading "fresh oracle absent".

## Driver output

```
=== Case A: LANE7_RPC=foo ===
exit: 2, elapsed: 4ms
PASS  exit code 2
PASS  FATAL line 1 (malformed)
PASS  wallclock 4ms (≤ 500ms)
PASS  no Markdown report written
PASS  echoes value

=== Case B: LANE7_RPC=http:// ===
exit: 2, elapsed: 4ms

=== Case C: LANE7_RPC=tcp://localhost:8545 ===
exit: 2, elapsed: 3ms

=== Case D: trailing space ===
exit: 2, elapsed: 4ms

=== Case E: trailing CR ===
exit: 2, elapsed: 4ms

=== Case F: valid LANE7_RPC=http://127.0.0.1:<port> ===
exit: 0
PASS  freshness row from valid RPC
PASS  no FATAL on valid path

=== Case G: unset LANE7_RPC (regression) ===
exit: 0
PASS  LANE7_RPC unset WARN

=== Case H: query string redaction in FATAL echo ===
exit: 2
PASS  exit code 2
PASS  no API key leak in stderr
PASS  redacted echo (host only)

ALL CASES PASS
```

## Captured stderr (Case A)

```
FATAL: malformed LANE7_RPC — must match http(s)://host[:port][/path]
FATAL: LANE7_RPC=foo
```

The smoke exits in 4 ms — no service probe, no node child, no
Markdown report.

## Query-string redaction (Case H)

Input: `LANE7_RPC=http://localhost:8545?key=SUPERSECRETAPIKEY\r`

The trailing `\r` makes the regex fail, hitting the FATAL branch.
The `${LANE7_RPC%%\?*}` strip cuts everything from the first `?`
onward before the echo. Stderr:

```
FATAL: malformed LANE7_RPC — must match http(s)://host[:port][/path]
FATAL: LANE7_RPC=http://localhost:8545
```

`SUPERSECRETAPIKEY` does not appear anywhere in stderr or stdout —
asserted explicitly by the proof driver.

## No-regression check

- `proof/run-future-dated.sh` — all four cases still pass.
- `proof/run-rpc-timeout.sh` — all three cases still pass (TIMEOUT
  branch unchanged; BADURL branch is parallel).
- `proof/run-contract-preflight.sh` — all four cases still pass.
- `proof/run-env-crlf.sh` — all three cases still pass.
- `proof/run-address-validation.sh` — all seven cases still pass.
- `proof/run-input-validation.sh` — preflight regressions clean.
- `proof/run-malformed-url.sh` — preflight regressions clean
  (probe-URL FATAL block is unchanged).

## Pointers

- Smoke script: [`scripts/testnet/internal-smoke.sh`](../../../scripts/testnet/internal-smoke.sh)
- Driver: [`proof/run-rpc-url-validation.sh`](./proof/run-rpc-url-validation.sh)
- PRD: [`tasks/0015-smoke-lane7-rpc-not-url-validated.md`](./tasks/0015-smoke-lane7-rpc-not-url-validated.md)
