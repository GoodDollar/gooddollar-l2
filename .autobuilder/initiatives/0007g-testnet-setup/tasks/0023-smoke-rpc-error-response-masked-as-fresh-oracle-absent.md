---
id: 0023-smoke-rpc-error-response-masked-as-fresh-oracle-absent
title: "internal-smoke.sh: any JSON-RPC `error` response (execution reverted, method not found, server error) silently becomes `0` and surfaces as the benign `fresh oracle absent (testnet candidate phase)` WARN, hiding real RPC infra failures"
parent: 0007g-testnet-setup
deps: []
split: false
depth: 1
planned: true
executed: true
---

## Problem statement

The on-chain freshness probe in `scripts/testnet/internal-smoke.sh`
(lines 536–571) sends a JSON-RPC `eth_call` and parses the
response with:

```js
res.on("end", () => {
  try {
    const j = JSON.parse(raw);
    if (!j.result || j.result === "0x") { console.log("0"); return; }
    console.log(BigInt(j.result).toString());
  } catch (_) { console.log("0"); }
});
```

This branch handles **only** the success shape
(`{ "jsonrpc": "2.0", "id": 1, "result": "0x…" }`). Every other
RPC response shape — and JSON-RPC servers can legitimately
return many — collapses into the same `console.log("0")` path
that the bash side then interprets at line 581 as:

```bash
elif [[ "$last_updated" == "0" ]]; then
  add_summary "⚠️  StockOracleV2.lastUpdated() returned 0 — fresh oracle absent (testnet candidate phase)"
  WARNINGS+=("on-chain oracle has no signer-supplied data yet")
```

That WARN is **the same message** the operator expects to see
on a pre-deploy lane (oracle contract is deployed but no signer
has written to it yet). So when the RPC infra is actually
broken, the operator reads "fresh oracle absent — testnet
candidate phase" and takes no action — exactly the message they
treat as benign.

### Failure modes the bug masks

All four were reproduced directly against a `node http`-based
fake RPC stub during the iter-5 deep-dive:

1. **`{"jsonrpc":"2.0","id":1,"error":{"code":-32000,"message":"execution reverted: not deployed"}}`**
   — what Geth/Anvil return when the contract address is valid
   hex but no code is deployed at it (operator pointed at the
   wrong oracle by a 0x typo or stale `addresses.json`).
   Today: WARN "fresh oracle absent". Actually: the wrong
   address, signer is fine.

2. **`{"jsonrpc":"2.0","id":1,"error":{"code":-32601,"message":"the method eth_call does not exist"}}`**
   — what some restricted public RPCs (e.g., websocket-only
   providers, archival-disabled nodes) return for `eth_call`.
   Today: WARN "fresh oracle absent". Actually: misconfigured
   `LANE7_RPC` — operator pointed at the wrong endpoint.

3. **`{"jsonrpc":"2.0","id":1,"error":{"code":-32603,"message":"Internal error"}}`**
   — generic server error during a node restart / mempool
   reorg. Today: WARN "fresh oracle absent". Actually: a
   transient RPC outage that should be retried.

4. **`{"jsonrpc":"2.0","id":1,"result":null}`** — what some
   nodes return when `block` parameter is honored as "latest"
   but no state is available (newly-started chain, pruned
   archival state). The current `if (!j.result || …)` check
   maps `null` → falsy → "0". WARN "fresh oracle absent".
   Actually: state-availability problem.

Reproduced via the script's exact node-e payload against a
stub RPC server:

```
[rpc-stub] received: {"jsonrpc":"2.0","id":1,"method":"eth_call",
  "params":[{"to":"0x0000…0123","data":"0xd0b06f5d"},"latest"]}
node prints: '0'
Smoke would interpret this as: 0 → 'fresh oracle absent (testnet
  candidate phase) WARN'
But the actual RPC said: execution reverted: not deployed
```

### Why this matters

1. **It defeats the smoke's primary job for the on-chain leg.**
   The lane-7 spec's required evidence is "on-chain freshness
   checked or explicitly blocked by missing `LANE7_RPC` /
   signer key" (spec, line 17). Today the smoke is
   indistinguishable in its WARN output between:
   - the legitimate pre-deploy state ("we haven't written yet"),
   - the operator pointing at the wrong contract,
   - the operator pointing at the wrong RPC,
   - the RPC having an outage,
   - state pruning on the RPC node.
   The latter four are real BLOCKERs that today look identical
   to the first WARN. The operator who relies on the smoke for
   triage gets no signal.

2. **Task 0014 fixed the special case but missed the general
   case.** 0014 added an address-shape validation that catches
   the "invalid hex address" RPC-422 path before it reaches
   the eth_call. But it does NOT catch errors from a
   well-formed-but-wrong address (e.g., `0xdead…beef` with
   no contract at it), nor errors from the RPC server itself
   (method-not-found, internal error). Those still flow
   through the `if (!j.result …) console.log("0")` swallow.

3. **Task 0010 added a request-level socket timeout** but
   only catches network-layer hangs. An RPC server that
   responds within 10s with `{"error": …}` flows through the
   error-swallow path; the request looks fast and successful.

4. **The fix surface is small** — branch the node-side on
   `j.error` and forward a structured sentinel to bash, just
   like the existing `BADURL` and `TIMEOUT` sentinels.
   Pattern is already established.

## User story

As a lane-7 operator running the smoke against a freshly
deployed testnet RPC, I want the smoke to clearly distinguish:

- "the oracle contract exists and has no data yet" (WARN —
  expected pre-deploy state),
- "the oracle contract address is wrong / has no code" (BLOCKER
  or distinct WARN with the RPC error message),
- "the RPC is broken / rejected the call" (BLOCKER or distinct
  WARN with the RPC error message),

so I can diagnose the actual on-chain state without guessing
which of three completely different conditions produced the
same "fresh oracle absent" line.

## How it was found

Stress-test of `scripts/testnet/internal-smoke.sh`'s on-chain
probe during product review iteration #5 (deep-dive on the
most complex feature in the 0007g-testnet-setup initiative).

A standalone repro spawned a fake JSON-RPC server returning
four canonical error shapes and ran the script's exact
`node -e` payload against each. All four collapsed to the
same `"0"` output and would surface as the benign
"fresh oracle absent" WARN in the report — masking conditions
that are operationally distinct.

Reference points for the standard JSON-RPC error shapes:
[JSON-RPC 2.0 spec § 5.1](https://www.jsonrpc.org/specification#error_object)
defines `error.code` and `error.message`. Geth, Erigon, Anvil,
Reth, and the major hosted RPCs (Alchemy, Infura, QuickNode)
all conform to this shape for both protocol-level errors
(`-32601 method not found`) and execution-level errors
(`-32000 execution reverted`).

## Proposed fix

Add explicit handling for the `j.error` branch in the node-e
script, surfacing a structured sentinel to bash. The bash side
already supports two sentinels (`BADURL` from task 0015,
`TIMEOUT` from task 0010); add `RPCERR:<code>:<message>` and
`NOCODE` as siblings, then branch on them in the existing
`if/elif` chain.

### Node-side change (lines 553–562)

```js
res.on("end", () => {
  try {
    const j = JSON.parse(raw);
    if (j && j.error) {
      // Truncate message + sanitize newlines so the bash side
      // sees a single line. Code is an integer; message can be
      // arbitrary server text.
      const code = (j.error.code === undefined) ? "?" : String(j.error.code);
      const msg = String(j.error.message || "").replace(/[\r\n\t]/g, " ").slice(0, 160);
      console.log("RPCERR:" + code + ":" + msg);
      return;
    }
    if (j && j.result === "0x") {
      // Distinct from `null`/missing — contract responded with empty bytes.
      // Most commonly: contract exists but the call slot is uninitialized.
      // Keep mapping to the pre-deploy WARN ("0").
      console.log("0");
      return;
    }
    if (!j || j.result === undefined || j.result === null) {
      // null/undefined result with no error object — pruned state,
      // bad block tag, or non-conforming server. Distinguish from
      // the legitimate pre-deploy "0".
      console.log("NORESULT");
      return;
    }
    console.log(BigInt(j.result).toString());
  } catch (_) { console.log("PARSEFAIL"); }
});
```

### Bash-side change (lines 575–604)

Insert two new branches after the existing `BADURL` / `TIMEOUT`
clauses, before the `"0"` clause. Keep the `"0"` clause
unchanged so the pre-deploy WARN message survives:

```bash
elif [[ "$last_updated" == RPCERR:* ]]; then
  rpc_err="${last_updated#RPCERR:}"           # "<code>:<message>"
  rpc_err_md="$(escape_md_cell "$rpc_err")"   # markdown-safe
  add_summary "❌ StockOracleV2.lastUpdated() RPC returned error \`$rpc_err_md\` (\`LANE7_RPC=$rpc_redacted\`)"
  BLOCKERS+=("on-chain oracle eth_call returned RPC error ($rpc_err) — check STOCK_ORACLE_V2_ADDRESS and LANE7_RPC")
elif [[ "$last_updated" == "NORESULT" ]]; then
  add_summary "⚠️  StockOracleV2.lastUpdated() RPC returned null/undefined result (pruned state? bad block tag?) — on-chain freshness skipped (\`LANE7_RPC=$rpc_redacted\`)"
  WARNINGS+=("on-chain oracle eth_call returned no result (LANE7_RPC=$rpc_redacted)")
elif [[ "$last_updated" == "PARSEFAIL" ]]; then
  add_summary "⚠️  StockOracleV2.lastUpdated() RPC returned non-JSON response — on-chain freshness skipped (\`LANE7_RPC=$rpc_redacted\`)"
  WARNINGS+=("on-chain oracle eth_call response did not parse as JSON (LANE7_RPC=$rpc_redacted)")
elif [[ "$last_updated" == "0" ]]; then
  # Existing pre-deploy WARN — unchanged.
  add_summary "⚠️  StockOracleV2.lastUpdated() returned 0 — fresh oracle absent (testnet candidate phase)"
  WARNINGS+=("on-chain oracle has no signer-supplied data yet")
```

### Severity choice (BLOCKER vs WARN)

- `RPCERR` → **BLOCKER**. Smoke must not pass when the RPC is
  rejecting the operator's contract address. Either the
  contract isn't deployed, the address is wrong, or the chain
  is in a state where the call fails. None of these are
  "testnet candidate phase" — all need operator action.
- `NORESULT` → **WARN**. Pruned state or non-conforming server
  can happen on legitimate RPC nodes; surface but don't block.
- `PARSEFAIL` → **WARN**. A non-JSON response is almost
  certainly transport or proxy interference; warn so the
  operator notices, but don't block on a single bad response
  (the operator can re-run if it persists).
- `0` (existing pre-deploy WARN) — unchanged.

### Why not promote ALL RPC errors to BLOCKER?

A `-32603 Internal error` during a node restart is transient.
A flaky CI run could trip it once. Treating ALL RPC failures
as BLOCKER would make the smoke noisy. The chosen split is:
"server says the call is wrong" (BLOCKER) vs "server is
flapping or in an unusual state" (WARN). The current
"swallow everything" position is strictly worse than both
options.

### Why include the error message in the BLOCKER text?

Operators need to see "execution reverted: not deployed" vs
"method not found" vs "internal error" to know which lever to
pull. The message is server-controlled and could contain
markdown / shell-special chars, so it routes through
`escape_md_cell` for the markdown row and stays raw in the
BLOCKERS[] array (which only echoes via `printf '%s\n'` — no
shell interpretation).

## Acceptance criteria

1. RPC returning `{"error":{"code":-32000,"message":"execution reverted: not deployed"}}`
   produces a BLOCKER with the message included and exit code 1.
2. RPC returning `{"error":{"code":-32601,"message":"the method eth_call does not exist"}}`
   produces a BLOCKER with the message included and exit code 1.
3. RPC returning `{"error":{"code":-32603,"message":"Internal error"}}`
   produces a BLOCKER (transient or not, the smoke must
   surface it; operators can choose to re-run).
4. RPC returning `{"result":null}` produces a WARN (NORESULT
   path), distinct from the pre-deploy WARN, exit code 0.
5. RPC returning non-JSON (e.g., HTML 502 page) produces a
   WARN (PARSEFAIL path), exit code 0.
6. RPC returning `{"result":"0x"}` continues to produce the
   existing pre-deploy WARN "fresh oracle absent (testnet
   candidate phase)" (NO regression on the documented
   pre-deploy state).
7. RPC returning `{"result":"0x000…0123"}` (a real timestamp)
   continues to produce the existing fresh / stale / future
   evaluation paths (NO regression on the happy/stale/future
   logic).
8. Error message in the BLOCKER text is sanitized: newlines /
   tabs / carriage returns replaced with spaces; truncated to
   160 chars; markdown-special chars escaped via
   `escape_md_cell` for the report row.
9. The redacted `LANE7_RPC` value appears in every new
   BLOCKER/WARN message (consistent with the existing TIMEOUT
   / BADURL / pre-deploy messages — task 0016's redaction
   discipline).
10. Proof captured in
    `.autobuilder/initiatives/0007g-testnet-setup/iter14-smoke-rpc-error-surfacing.md`
    with:
    - all four error-shape reproductions (transcript of the
      stub server's request + the resulting smoke verdict),
    - the pre-deploy regression case (still WARN),
    - the happy-path regression case (still produces a
      numeric `last_updated`).
11. Single commit on the lane-7 branch:
    `0007g/0023: surface RPC error responses on on-chain freshness probe`.

## Verification

- Add a proof driver
  `.autobuilder/initiatives/0007g-testnet-setup/proof/run-rpc-error-shapes.sh`
  that:
  - spawns a small node http RPC stub on a 49xxx port that
    routes by request `id` to one of: `{result: "0x…ts"}`,
    `{result: "0x"}`, `{result: null}`, `{error: {code, message}}`
    (one per code variant), or returns HTML 502,
  - runs the smoke once per shape (or routes by stub state),
  - asserts the expected verdict + WARNING/BLOCKERS content
    per the criteria above.
- Re-run every existing proof driver (especially 0010, 0014,
  0015) and confirm each exits 0 with byte-identical reports
  modulo timestamps.
- `time` the smoke against the stub to confirm no measurable
  overhead from the additional bash branches (the JSON parse
  + branch is server-side; bash side is one extra `case` arm).

## Out of scope

- Retrying RPC calls. The smoke is a snapshot, not a poller.
  If `RPCERR -32603` is transient, the operator re-runs.
- Adding a separate "rpc-health" probe section to the report.
  The on-chain freshness probe already implicitly probes
  RPC health; the new branches surface what they observe.
- Differentiating `execution reverted` from `revert with
  custom error` in the message. The message is forwarded
  verbatim (truncated + sanitized) — operators can decode
  bytes-style reverts themselves.
- Validating `j.id` against the request `id` to detect
  mis-correlated responses. Trust the same-connection
  semantics of http(s) keep-alive. (Future hardening if a
  reverse-proxy multiplexer is introduced.)
- Recovering from PARSEFAIL by trying a second JSON parse
  with relaxed rules. Out of scope — the smoke is a
  one-shot probe.
- Replacing the hand-rolled `http.request` with `ethers.js`
  or `viem`. The current pure-node approach is intentional
  (no new dependency); error-shape handling is a node-side
  fix, not a library migration.
- Adding per-RPC-provider quirks (Alchemy's `code: 429`
  rate-limit, Infura's project-id-required responses). The
  generic JSON-RPC `j.error` handling captures all of these;
  provider-specific UX is a runbook concern.

---

## Planning

### Overview

The PRD identifies a single response-handler in
`scripts/testnet/internal-smoke.sh` (the inline `node -e` block at
lines 536–571) that today collapses every non-`result` JSON-RPC
response shape into the literal string `"0"`, which the bash side
then treats as the benign pre-deploy WARN. The fix splits the
node-side parser into four distinct outcomes (`<numeric>`, `0`,
`RPCERR:<code>:<message>`, `NORESULT`, `PARSEFAIL`) and adds three
matching `elif` branches in the existing bash classification chain.
The sentinel pattern (`RPCERR:` / `NORESULT` / `PARSEFAIL`) mirrors
the established `BADURL` (task 0015) and `TIMEOUT` (task 0010)
sentinels — same shape, same wire format.

### Research notes

- **JSON-RPC 2.0 §5.1** ([jsonrpc.org spec](https://www.jsonrpc.org/specification#error_object))
  guarantees `error.code` (integer) and `error.message` (string)
  on any error response. Geth, Erigon, Anvil, Reth, Alchemy,
  Infura, QuickNode all conform.
- **Four canonical error shapes** were reproduced during product
  review iter-5 against a fake `node http` RPC stub — see PRD
  §How it was found.
- **Existing sentinel discipline**: `BADURL` and `TIMEOUT` already
  travel through the same `console.log` → `last_updated` capture
  → bash `[[ … ]]` classification path. New sentinels follow the
  same shape: `<TAG>` or `<TAG>:<payload>`.
- **Severity split rationale**: `RPCERR` = BLOCKER (server says
  the call itself is wrong — wrong contract or wrong RPC, both
  need operator action). `NORESULT` / `PARSEFAIL` = WARN
  (transient or non-conforming, re-runnable).
- **Message sanitization**: server-controlled `error.message` is
  bounded at 160 chars + `\r\n\t` → space on the node side, then
  routed through `escape_md_cell` on the bash side for the
  Markdown row. Raw value stays in `BLOCKERS[]` for terminal
  echo (same discipline as task 0018).
- **Task 0016's RPC redaction** (`rpc_redacted`) already exists in
  the surrounding bash block and is reused verbatim in every new
  message.

### Architecture diagram

```mermaid
flowchart TD
    Bash[bash: probe_onchain_freshness] --> Node["node -e: send eth_call,<br/>parse response"]
    Node --> Branch{response shape}
    Branch -- "{result: '0x…'}" --> Numeric["console.log BigInt-as-string"]
    Branch -- "{result: '0x'}" --> Zero["console.log '0'<br/>(pre-deploy WARN — unchanged)"]
    Branch -- "{result: null|undefined}" --> NoResult["NEW: console.log 'NORESULT'"]
    Branch -- "{error: {code, message}}" --> RpcErr["NEW: console.log 'RPCERR:CODE:MSG'<br/>(160-char + nl-strip)"]
    Branch -- parse fail --> ParseFail["NEW: console.log 'PARSEFAIL'<br/>(was: '0')"]
    Numeric --> CapBash[bash: last_updated=$(...)]
    Zero --> CapBash
    NoResult --> CapBash
    RpcErr --> CapBash
    ParseFail --> CapBash
    CapBash --> Classify{bash classification chain<br/>BADURL/TIMEOUT/...}
    Classify --> Verdict[verdict + SUMMARY_LINES + BLOCKERS/WARNINGS]
    classDef new fill:#cfc,stroke:#080;
    class NoResult,RpcErr,ParseFail new
```

### One-week decision

**YES** — fits in one day.

Rationale:
- Two localized patches: ~10 lines of node-side branching, ~15
  lines of bash-side `elif` branches. No new helpers.
- Proof driver pattern is established (existing
  `proof/run-rpc-timeout.sh` already spawns a fake RPC server
  on a 49xxx port — same harness, just routes by request `id`
  or by stub state).
- All four error shapes are deterministic stub responses; no
  flaky timing.

### Implementation plan

1. **Patch the node-e response handler** in
   `scripts/testnet/internal-smoke.sh` (lines 553–562) to branch
   on `j.error` / `j.result == "0x"` / `j.result == null` /
   parse-failure per PRD §Node-side change. Keep the existing
   `BigInt(j.result).toString()` path for successful timestamps
   unchanged.
2. **Insert the three new bash `elif` branches** (`RPCERR:*`,
   `NORESULT`, `PARSEFAIL`) into the classification chain (lines
   575–604) BEFORE the existing `"0"` clause. The `"0"` clause
   stays byte-identical so the pre-deploy WARN message is
   preserved.
3. **Wire `escape_md_cell` into the RPCERR message row** for the
   server-controlled `error.message` substring (raw value stays
   in `BLOCKERS[]`).
4. **Reuse `$rpc_redacted`** (from task 0016) in every new
   SUMMARY_LINE and BLOCKER/WARN message — no new redaction
   helper needed.
5. **Write proof driver**
   `.autobuilder/initiatives/0007g-testnet-setup/proof/run-rpc-error-shapes.sh`
   that spawns a small `node http` RPC stub on a 49xxx port,
   routes by stub state (or by env knob), and runs the smoke
   once per shape:
   - `{result: "0x…ts"}` → expect verdict 0, numeric path
   - `{result: "0x"}` → expect verdict 0, pre-deploy WARN
   - `{result: null}` → expect verdict 0, NORESULT WARN
   - `{error: {code: -32000, message: "execution reverted: …"}}` → expect verdict 1, RPCERR BLOCKER
   - `{error: {code: -32601, message: "the method eth_call does not exist"}}` → expect verdict 1, RPCERR BLOCKER
   - `{error: {code: -32603, message: "Internal error"}}` → expect verdict 1, RPCERR BLOCKER
   - HTML 502 → expect verdict 0, PARSEFAIL WARN
6. **Regression check**: re-run `proof/run-rpc-timeout.sh`,
   `proof/run-address-validation.sh`, `proof/run-rpc-url-validation.sh`
   and confirm each exits 0 with byte-identical reports modulo
   timestamps.
7. **Capture proof** in
   `.autobuilder/initiatives/0007g-testnet-setup/iter14-smoke-rpc-error-surfacing.md`
   per PRD §Acceptance #10 — all four error reproductions,
   pre-deploy regression, happy-path regression.
8. **Commit** as `0007g/0023: surface RPC error responses on on-chain freshness probe`.

TDD ordering: write the proof driver first (it will fail because
the unpatched script reports the pre-deploy WARN for all four
error shapes — driver asserts BLOCKER), then patch node + bash,
then observe the driver passing.
