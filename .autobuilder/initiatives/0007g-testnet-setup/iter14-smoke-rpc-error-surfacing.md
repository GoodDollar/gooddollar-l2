# iter14 — internal-smoke RPC error surfacing (task 0007g/0023)

## Summary

The on-chain freshness probe's `node -e` response parser handled
only the success shape (`{result: "0x..."}`) and collapsed every
other JSON-RPC response into `console.log("0")`. The bash side then
treated `"0"` as the benign pre-deploy WARN
(`"fresh oracle absent (testnet candidate phase)"`). That hides
four operationally distinct failure modes — all of which a 3 AM
operator needs to distinguish:

| RPC response                                                | Reality                                              | Was reported as |
|-------------------------------------------------------------|------------------------------------------------------|-----------------|
| `{"error":{"code":-32000,"message":"execution reverted…"}}` | Wrong contract / no code at address                  | pre-deploy WARN |
| `{"error":{"code":-32601,"message":"the method…"}}`         | Wrong RPC endpoint / restricted provider             | pre-deploy WARN |
| `{"error":{"code":-32603,"message":"Internal error"}}`      | Transient outage / node restart                      | pre-deploy WARN |
| `{"result":null}`                                           | Pruned archival state / bad block tag                | pre-deploy WARN |
| HTML 502 (non-JSON)                                         | Proxy / transport interference                       | pre-deploy WARN |

Task 0010 added a request-level socket timeout (catches network
hangs). Task 0014 validated address shape (catches the
RPC-rejects-bad-address path). Neither catches a well-formed
request landing on a malfunctioning RPC and getting back a
proper JSON-RPC error envelope.

## Patch shape

### Node-side (response handler in the `node -e` block)

Branch on `j.error`, `j.result === null`, and parse-failure, each
emitting a structured sentinel that the bash side classifies:

```js
res.on("end", () => {
  try {
    const j = JSON.parse(raw);
    if (j && j.error) {
      const code = (j.error.code === undefined) ? "?" : String(j.error.code);
      const msg = String(j.error.message || "")
        .replace(/[\r\n\t]/g, " ")
        .slice(0, 160);
      console.log("RPCERR:" + code + ":" + msg);
      return;
    }
    if (j && j.result === "0x") { console.log("0"); return; }
    if (!j || j.result === undefined || j.result === null) {
      console.log("NORESULT"); return;
    }
    console.log(BigInt(j.result).toString());
  } catch (_) { console.log("PARSEFAIL"); }
});
```

Sentinel shape (`<TAG>` or `<TAG>:<payload>`) mirrors the
established `BADURL` (task 0015) and `TIMEOUT` (task 0010)
sentinels. Server-controlled `error.message` is sanitized at the
boundary (`\r\n\t` → space, 160 chars max).

### Bash-side (classification chain)

Three new `elif` branches inserted before the existing `"0"`
clause. The `"0"` clause stays byte-identical so the pre-deploy
WARN is preserved.

```bash
elif [[ "$last_updated" == RPCERR:* ]]; then
  rpc_err="${last_updated#RPCERR:}"
  rpc_err_md="$(escape_md_cell "$rpc_err")"
  add_summary "❌ StockOracleV2.lastUpdated() RPC returned error \`$rpc_err_md\` (\`LANE7_RPC=$rpc_redacted\`)"
  BLOCKERS+=("on-chain oracle eth_call returned RPC error ($rpc_err) — check STOCK_ORACLE_V2_ADDRESS and LANE7_RPC")
elif [[ "$last_updated" == "NORESULT" ]]; then
  add_summary "⚠️  StockOracleV2.lastUpdated() RPC returned null/undefined result (pruned state? bad block tag?) — on-chain freshness skipped (\`LANE7_RPC=$rpc_redacted\`)"
  WARNINGS+=("on-chain oracle eth_call returned no result (LANE7_RPC=$rpc_redacted)")
elif [[ "$last_updated" == "PARSEFAIL" ]]; then
  add_summary "⚠️  StockOracleV2.lastUpdated() RPC returned non-JSON response — on-chain freshness skipped (\`LANE7_RPC=$rpc_redacted\`)"
  WARNINGS+=("on-chain oracle eth_call response did not parse as JSON (LANE7_RPC=$rpc_redacted)")
```

### Severity split

| Sentinel    | Severity | Rationale                                                                                  |
|-------------|----------|--------------------------------------------------------------------------------------------|
| `RPCERR:`   | BLOCKER  | Server says the call is wrong — wrong contract or wrong RPC. Operator action required.     |
| `NORESULT`  | WARN     | Pruned state / non-conforming server. Re-runnable.                                         |
| `PARSEFAIL` | WARN     | Transport / proxy interference. Re-runnable.                                               |
| `0`         | WARN     | **Unchanged** — pre-deploy state. Preserved byte-identical.                                |

Server-controlled `error.message` lands in the Markdown row via
`escape_md_cell` (single sanitization stop, post-0018 / 0021
discipline). Raw value stays in `BLOCKERS[]` for the terminal echo.

## Acceptance criteria evidence

```
=== Case A: execution reverted (mode=revert) ===
exit: 1
PASS  execution reverted → BLOCKER (exit 1)
PASS  RPCERR row with execution-reverted text
PASS  RPCERR row uses BLOCKER icon
PASS  no pre-deploy WARN on execution-reverted

=== Case B: method not found (mode=method) ===
exit: 1
PASS  method not found → BLOCKER (exit 1)
PASS  RPCERR row names method-not-found
PASS  no pre-deploy WARN on method-not-found

=== Case C: internal error (mode=internal) ===
exit: 1
PASS  internal error → BLOCKER (exit 1)
PASS  RPCERR row names internal-error

=== Case D: null result (mode=null-result) ===
exit: 0
PASS  null result → verdict-grade (warn) (exit 0)
PASS  NORESULT warn line
PASS  no pre-deploy WARN on NORESULT

=== Case E: HTML 502 (non-JSON) (mode=html-502) ===
exit: 0
PASS  HTML 502 → verdict-grade (warn) (exit 0)
PASS  PARSEFAIL warn line

=== Case F: result 0x (pre-deploy regression) (mode=empty-hex) ===
exit: 0
PASS  0x → verdict-grade (warn) (exit 0)
PASS  pre-deploy WARN preserved
PASS  no RPCERR misclassification

=== Case G: real timestamp (happy path) (mode=fresh) ===
exit: 0
PASS  fresh ts → verdict-grade (exit 0)
PASS  fresh row

ALL CASES PASS
```

## Regression sweep

All 17 proof drivers pass (16 prior + run-rpc-error-shapes.sh).
Notably:

- `run-rpc-timeout.sh` (working RPC happy path + timeout) PASS — `BigInt(result)` path still fires.
- `run-address-validation.sh` PASS — address-shape preflight still catches invalid hex.
- `run-rpc-url-validation.sh` PASS — `BADURL` sentinel preserved.

## Out of scope

- Retrying transient RPC errors. The smoke is a snapshot, not a poller.
- Differentiating `execution reverted` from `revert with custom error`.
  The message is forwarded verbatim.
- Validating `j.id` against the request `id`. Trust same-connection
  http(s) keep-alive semantics.
- Replacing the hand-rolled `http.request` with `ethers.js` / `viem` —
  separate dependency-introducing decision.
