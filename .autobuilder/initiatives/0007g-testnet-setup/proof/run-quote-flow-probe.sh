#!/usr/bin/env bash
# Lane-7 internal-smoke /quotes/fresh/all probe driver
# (task 0007g/0024).
#
# The smoke probed /health only — and /health short-circuits to
# `status: ok` whenever `cache.size === 0`. A price-service with no
# upstream feed, all symbols filtered, or a stale binary running
# without the eToro adapter wired up returns 200 ok / no fresh
# quotes flowing. The smoke reported GREEN. The spec's URGENT
# OVERRIDE ("price-service reachable and serving non-empty
# normalized quotes") was unverified.
#
# Fix: new `## Price-service quote flow` section, sequenced after
# /health and before on-chain freshness. Probes /quotes/fresh/all
# (existing endpoint, no service changes), asserts count >=
# MIN_FRESH_QUOTES (default 1) and freshest quote age <=
# QUOTE_MAX_AGE_S (default 600s). The section auto-skips for
# operators whose price-service /health doesn't include the
# expected freshQuotes field (preserves the existing proof
# drivers that use generic fake servers).
#
# Cases:
#   A. green        — count=3, fresh        → exit 0, all OK rows
#   B. empty        — count=0, /health ok   → exit 1, count BLOCKER
#   C. stale        — count=3, ts=now-1Ms   → exit 0, age WARN
#   D. unreachable  — port has no listener  → quote-flow section skipped with note
#   E. non-JSON     — /quotes returns HTML  → exit 1, parse BLOCKER (PRICE_SERVICE_QUOTES_URL opt-in)

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"
HARNESS="$REPO_ROOT/.autobuilder/initiatives/0007g-testnet-setup/proof/fake-status-server.js"

GREEN_PORT=49801
PS_PORT=49802
HTML_PORT=49803

cleanup() {
  for pid in "${GREEN_PID:-}" "${PS_PID:-}" "${HTML_PID:-}"; do
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
    [[ -n "$pid" ]] && wait "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT

assert_substr() {
  local label="$1" file="$2" needle="$3"
  if grep -qF "$needle" "$file"; then
    echo "PASS  $label"
  else
    echo "FAIL  $label  — missing literal: $needle"
    echo "--- file contents ---"
    cat "$file"
    return 1
  fi
}

refute_substr() {
  local label="$1" file="$2" needle="$3"
  if grep -qF "$needle" "$file"; then
    echo "FAIL  $label  — found forbidden literal: $needle"
    echo "--- file contents ---"
    cat "$file"
    return 1
  else
    echo "PASS  $label"
  fi
}

# Synthetic price-service stub. Mode controls /quotes/fresh/all
# shape; /health always returns a real-price-service-shaped body
# (status, freshQuotes, totalCached, configuredSymbols, timestamp)
# so the smoke's auto-skip heuristic recognizes it as a real
# lane-7 price-service.
start_ps() {
  local mode="$1"
  PS_MODE="$mode" node -e '
const http = require("http");
const port = parseInt(process.argv[1], 10);
const mode = process.env.PS_MODE;
http.createServer((req, res) => {
  const now = Date.now();
  const url = new URL(req.url || "/", "http://localhost");
  if (url.pathname === "/health") {
    const freshQuotes = mode === "empty" ? 0 : 3;
    const totalCached = mode === "empty" ? 0 : 3;
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      freshQuotes,
      totalCached,
      configuredSymbols: 3,
      timestamp: now,
    }));
    return;
  }
  if (url.pathname === "/quotes/fresh/all") {
    let quotes = [];
    if (mode === "green") {
      quotes = [
        { symbol: "AAPL", price: 187.42, ts: now, source: "etoro-demo" },
        { symbol: "MSFT", price: 412.10, ts: now, source: "etoro-demo" },
        { symbol: "TSLA", price: 245.66, ts: now, source: "etoro-demo" },
      ];
    } else if (mode === "stale") {
      const stale = now - 1_000_000;
      quotes = [
        { symbol: "AAPL", price: 187.42, ts: stale, source: "etoro-demo" },
        { symbol: "MSFT", price: 412.10, ts: stale, source: "etoro-demo" },
        { symbol: "TSLA", price: 245.66, ts: stale, source: "etoro-demo" },
      ];
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ quotes, count: quotes.length, timestamp: now }));
    return;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
}).listen(port, "127.0.0.1");
' "$PS_PORT" >/tmp/proof-quote-flow.ps.log 2>&1 &
  PS_PID=$!
  sleep 0.3
}

stop_ps() {
  if [[ -n "${PS_PID:-}" ]]; then
    kill "$PS_PID" 2>/dev/null || true
    wait "$PS_PID" 2>/dev/null || true
    PS_PID=
  fi
}

# Shared green services for non-price-service probes.
node "$HARNESS" "$GREEN_PORT" --profile lane7-smoke-green \
  >/tmp/proof-quote-flow.green.log 2>&1 &
GREEN_PID=$!
sleep 0.4

run_with_ps() {
  local mode="$1" report="$2"
  start_ps "$mode"
  PRICE_SERVICE_URL=http://127.0.0.1:$PS_PORT/health \
  ORACLE_SIGNER_URL=http://127.0.0.1:$GREEN_PORT/health \
  HEDGE_ENGINE_URL=http://127.0.0.1:$GREEN_PORT/health \
  STATUS_AGGREGATOR_URL=http://127.0.0.1:$GREEN_PORT/status.json \
  REPORT="$report" \
    "$SMOKE" >/dev/null 2>&1
  rc=$?
  stop_ps
}

# ---- Case A: green (count=3, fresh) ----
echo
echo "=== Case A: green (count=3, fresh) ==="
run_with_ps green /tmp/proof-quote-flow-A.md
echo "exit: $rc"
if (( rc != 0 )); then
  echo "FAIL  Case A expected exit 0, got $rc"
  cat /tmp/proof-quote-flow-A.md
  exit 1
fi
echo "PASS  exit 0"
assert_substr "section header present" \
  /tmp/proof-quote-flow-A.md "## Price-service quote flow" || exit 1
assert_substr "fresh quote count row" \
  /tmp/proof-quote-flow-A.md "fresh quote count" || exit 1
assert_substr "count 3 / min 1 OK" \
  /tmp/proof-quote-flow-A.md "3 / min 1" || exit 1
assert_substr "freshest age row" \
  /tmp/proof-quote-flow-A.md "freshest quote age" || exit 1
assert_substr "source first quote etoro-demo" \
  /tmp/proof-quote-flow-A.md "etoro-demo" || exit 1
refute_substr "no BLOCKER on green" \
  /tmp/proof-quote-flow-A.md "price-service has no fresh quotes" || exit 1

# ---- Case B: empty (count=0, /health ok) ----
echo
echo "=== Case B: empty (count=0, /health=ok) ==="
run_with_ps empty /tmp/proof-quote-flow-B.md
echo "exit: $rc"
if (( rc != 1 )); then
  echo "FAIL  Case B expected exit 1 (BLOCKER), got $rc"
  cat /tmp/proof-quote-flow-B.md
  exit 1
fi
echo "PASS  exit 1 (BLOCKER)"
assert_substr "section header present" \
  /tmp/proof-quote-flow-B.md "## Price-service quote flow" || exit 1
assert_substr "count BLOCKER" \
  /tmp/proof-quote-flow-B.md "price-service has no fresh quotes" || exit 1
assert_substr "diag breakdown shows configured/cached/fresh" \
  /tmp/proof-quote-flow-B.md "configured symbols: 3" || exit 1

# ---- Case C: stale (count=3, ts=now-1Ms) ----
echo
echo "=== Case C: stale (count=3, freshest 1000s old) ==="
run_with_ps stale /tmp/proof-quote-flow-C.md
echo "exit: $rc"
if (( rc != 0 )); then
  echo "FAIL  Case C expected exit 0 (WARN), got $rc"
  cat /tmp/proof-quote-flow-C.md
  exit 1
fi
echo "PASS  exit 0 (WARN, not BLOCKER)"
assert_substr "section header present" \
  /tmp/proof-quote-flow-C.md "## Price-service quote flow" || exit 1
assert_substr "freshest age WARN" \
  /tmp/proof-quote-flow-C.md "freshest quote is" || exit 1

# ---- Case D: unreachable (no listener on PS_PORT) ----
echo
echo "=== Case D: price-service unreachable (auto-skip) ==="
PRICE_SERVICE_URL=http://127.0.0.1:49911/health \
ORACLE_SIGNER_URL=http://127.0.0.1:$GREEN_PORT/health \
HEDGE_ENGINE_URL=http://127.0.0.1:$GREEN_PORT/health \
STATUS_AGGREGATOR_URL=http://127.0.0.1:$GREEN_PORT/status.json \
REPORT=/tmp/proof-quote-flow-D.md \
  "$SMOKE" >/dev/null 2>&1
rc=$?
echo "exit: $rc"
# price-service unreachable produces its own BLOCKER (verdict RED) but
# quote-flow section must self-skip with a note, NOT double-BLOCKER.
assert_substr "section header present" \
  /tmp/proof-quote-flow-D.md "## Price-service quote flow" || exit 1
assert_substr "skip note on unreachable" \
  /tmp/proof-quote-flow-D.md "skipped" || exit 1
refute_substr "no duplicate /quotes BLOCKER" \
  /tmp/proof-quote-flow-D.md "/quotes/fresh/all unreachable" || exit 1

# ---- Case E: PRICE_SERVICE_QUOTES_URL explicit override → non-JSON BLOCKER ----
echo
echo "=== Case E: explicit PRICE_SERVICE_QUOTES_URL with non-JSON response ==="
# Spawn an HTML stub.
node -e '
const http = require("http");
http.createServer((req, res) => {
  res.writeHead(502, { "content-type": "text/html" });
  res.end("<html>bad gateway</html>");
}).listen(parseInt(process.argv[1], 10), "127.0.0.1");
' "$HTML_PORT" >/tmp/proof-quote-flow.html.log 2>&1 &
HTML_PID=$!
sleep 0.3
start_ps green
PRICE_SERVICE_URL=http://127.0.0.1:$PS_PORT/health \
ORACLE_SIGNER_URL=http://127.0.0.1:$GREEN_PORT/health \
HEDGE_ENGINE_URL=http://127.0.0.1:$GREEN_PORT/health \
STATUS_AGGREGATOR_URL=http://127.0.0.1:$GREEN_PORT/status.json \
PRICE_SERVICE_QUOTES_URL=http://127.0.0.1:$HTML_PORT/x \
REPORT=/tmp/proof-quote-flow-E.md \
  "$SMOKE" >/dev/null 2>&1
rc=$?
stop_ps
kill "$HTML_PID" 2>/dev/null || true
wait "$HTML_PID" 2>/dev/null || true
HTML_PID=
echo "exit: $rc"
if (( rc != 1 )); then
  echo "FAIL  Case E expected exit 1, got $rc"
  cat /tmp/proof-quote-flow-E.md
  exit 1
fi
echo "PASS  exit 1 on non-JSON /quotes response"
assert_substr "non-JSON BLOCKER" \
  /tmp/proof-quote-flow-E.md "/quotes/fresh/all" || exit 1

echo
echo "ALL CASES PASS"
