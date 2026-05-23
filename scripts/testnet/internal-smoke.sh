#!/usr/bin/env bash
# Lane-7 internal testnet smoke — companion to scripts/testnet/health-gate.sh
# (which targets the public production surfaces).
#
# This script probes the lane-local stack only (PM2 names suffixed `-lane7`,
# default ports in the 49xxx range — see docs/testnet/INTERNAL-TESTNET-RUNBOOK.md).
# It MUST NEVER hit `https://goodswap.goodclaw.org` or
# `https://rpc.goodclaw.org` — production is owned by the gate, not this script.
#
# Probes, all driven by the documented HEALTH-CONTRACT.md classification:
#   1. price-service        /health  →  must be `ok`
#   2. oracle-signer        /health  →  `ok` or `health-only`
#   3. hedge-engine         /health  →  `ok` or `health-only` (dry-run mode)
#   4. status-aggregator    /status.json  →  oracle-signer + hedge-engine
#                            present AND EXCLUDED-classified per the contract
#   5. StockOracleV2.lastUpdated() on LANE7_RPC  →  freshness within
#                            STALENESS_THRESHOLD_S, OR explicit "no signer
#                            data yet — testnet candidate phase" note
#   6. real-trading fence   →  REAL_TRADING_ENABLED unset / false AND
#                            ETORO_MODE ∈ {mock, demo-readonly, sandbox, demo-trading}
#
# Style mirrors health-gate.sh: `set -u` only (probes continue past
# individual failures), node -e for JSON parsing, BLOCKERS / WARNINGS /
# SUMMARY_LINES arrays, single Markdown report.
#
# Requires (preflighted at startup, FATAL exit 2 on any missing):
#   bash 4+, node 18+, curl, awk, date (GNU coreutils on Linux hosts)
#
# Override env (all optional):
#   LANE7_BASE                default http://localhost
#   PRICE_SERVICE_PORT        default 4000           (integer, 1..65535)
#   ORACLE_SIGNER_PORT        default 9107           (integer, 1..65535)
#   HEDGE_ENGINE_PORT         default 9106           (integer, 1..65535)
#   STATUS_AGGREGATOR_PORT    default 9200           (integer, 1..65535)
#   PRICE_SERVICE_URL         override the price-service /health URL
#   ORACLE_SIGNER_URL         override the oracle-signer /health URL
#   HEDGE_ENGINE_URL          override the hedge-engine /health URL
#   STATUS_AGGREGATOR_URL     override the status-aggregator /status.json URL
#   LANE7_RPC                 default http://localhost:8545 — unset => skip on-chain
#   STOCK_ORACLE_V2_ADDRESS   default reads from op-stack/addresses.json
#   STALENESS_THRESHOLD_S     default 600            (non-negative integer seconds;
#                                                     duration suffixes like `10m`
#                                                     are NOT supported — fails fast)
#   LANE7_ENV_FILE            default .env at repo root
#   REPORT                    default docs/testnet/iter05-internal-smoke.md
#
# Exit semantics:
#   0  no blockers (green or green-with-warnings)
#   1  one or more blockers — operator must fix before promotion

set -u

# Tool dependencies. Order matters: the loop names the *first* missing tool,
# which is easier to act on than a list. node parses JSON, curl drives every
# HTTP probe, awk reads HEALTH-CONTRACT.md classification tables, date
# computes freshness age. Missing any one silently cascades into wrong
# blockers (`unreachable`, `MISSING-FROM-CONTRACT`, always-fresh-on-chain).
# Run before anything else so a bad PATH fails fast with a single message.
for tool in node curl awk date; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "FATAL: missing required tool: $tool" >&2
    exit 2
  fi
done

LANE7_BASE="${LANE7_BASE:-http://localhost}"
PRICE_SERVICE_PORT="${PRICE_SERVICE_PORT:-4000}"
ORACLE_SIGNER_PORT="${ORACLE_SIGNER_PORT:-9107}"
HEDGE_ENGINE_PORT="${HEDGE_ENGINE_PORT:-9106}"
STATUS_AGGREGATOR_PORT="${STATUS_AGGREGATOR_PORT:-9200}"

PRICE_SERVICE_URL="${PRICE_SERVICE_URL:-$LANE7_BASE:$PRICE_SERVICE_PORT/health}"
ORACLE_SIGNER_URL="${ORACLE_SIGNER_URL:-$LANE7_BASE:$ORACLE_SIGNER_PORT/health}"
HEDGE_ENGINE_URL="${HEDGE_ENGINE_URL:-$LANE7_BASE:$HEDGE_ENGINE_PORT/health}"
STATUS_AGGREGATOR_URL="${STATUS_AGGREGATOR_URL:-$LANE7_BASE:$STATUS_AGGREGATOR_PORT/status.json}"

# Probe-URL validation. The default-URL templates concatenate
# `$LANE7_BASE:$PORT/path` directly, which produces a syntactically
# invalid double-colon URL (`http://host:8080:4000/health`) whenever
# `LANE7_BASE` already includes a port. Today the smoke would report a
# generic "unreachable" blocker and the operator would chase a phantom
# outage. Validate up front and emit a single FATAL line per offending
# URL so the operator knows it's a config issue, not a service one. The
# regex is intentionally narrow (IPv4 / hostname only) — operators with
# host:port reverse-proxy setups should use the per-service `*_URL`
# escape hatches documented in the script header.
PROBE_URL_RE='^https?://[^:/]+(:[0-9]+)?(/.*)?$'
malformed=0
for pair in \
    "PRICE_SERVICE_URL=$PRICE_SERVICE_URL" \
    "ORACLE_SIGNER_URL=$ORACLE_SIGNER_URL" \
    "HEDGE_ENGINE_URL=$HEDGE_ENGINE_URL" \
    "STATUS_AGGREGATOR_URL=$STATUS_AGGREGATOR_URL"; do
  url="${pair#*=}"
  if [[ ! "$url" =~ $PROBE_URL_RE ]]; then
    if (( malformed == 0 )); then
      echo "FATAL: malformed probe URL — check LANE7_BASE / *_PORT / *_URL overrides" >&2
    fi
    echo "FATAL: $pair" >&2
    malformed=1
  fi
done
(( malformed == 0 )) || exit 2
unset PROBE_URL_RE malformed pair url

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LANE7_ENV_FILE="${LANE7_ENV_FILE:-$REPO_ROOT/.env}"
REPORT="${REPORT:-$REPO_ROOT/docs/testnet/iter05-internal-smoke.md}"
HEALTH_CONTRACT="${HEALTH_CONTRACT:-$REPO_ROOT/docs/testnet/HEALTH-CONTRACT.md}"
STALENESS_THRESHOLD_S="${STALENESS_THRESHOLD_S-600}"
LANE7_RPC="${LANE7_RPC-}"

# Numeric-input preflight. STALENESS_THRESHOLD_S participates in `(( ))`
# arithmetic; any non-digit value (e.g. systemd-style `10m`) used to raise
# a raw bash error mid-run and produce a misleading verdict. Validate up
# front so operators get a single FATAL line that names the offending
# variable. Ports are constrained to TCP range so 99999-style typos fail
# here instead of cascading into "unreachable" blockers downstream.
require_uint() {
  local name="$1" value="$2" min="${3:-0}" max="${4:-}"
  case "$value" in
    ''|*[!0-9]*)
      echo "FATAL: $name='$value' must be a non-negative integer (seconds)" >&2
      exit 2
      ;;
  esac
  if [[ -n "$max" ]] && { (( value < min )) || (( value > max )); }; then
    echo "FATAL: $name='$value' out of range [${min}, ${max}]" >&2
    exit 2
  fi
}

require_uint STALENESS_THRESHOLD_S  "$STALENESS_THRESHOLD_S"
require_uint PRICE_SERVICE_PORT     "$PRICE_SERVICE_PORT"     1 65535
require_uint ORACLE_SIGNER_PORT     "$ORACLE_SIGNER_PORT"     1 65535
require_uint HEDGE_ENGINE_PORT      "$HEDGE_ENGINE_PORT"      1 65535
require_uint STATUS_AGGREGATOR_PORT "$STATUS_AGGREGATOR_PORT" 1 65535

declare -a BLOCKERS=()
declare -a WARNINGS=()
declare -a SUMMARY_LINES=()

now_iso() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
add_summary() { SUMMARY_LINES+=("$1"); }

# ----- helpers -----

# Reusable tempfile for probe bodies. A single trap drops it on exit so
# probes never leak across runs and we keep curl/-w invocations atomic.
TMP_BODY="$(mktemp)"
trap 'rm -f "$TMP_BODY"' EXIT

# Probe a URL. On return, the calling shell sees:
#   HTTP_BODY  body bytes (empty on transport failure)
#   HTTP_CODE  HTTP status code (3-digit string; "000" if curl could not
#              complete the request)
#   HTTP_CT    response Content-Type header (empty on transport failure)
#   CURL_EXIT  curl(1) exit code — 0 success, 6 DNS, 7 refused, 28 timeout,
#              35 TLS, 52 empty reply, 56 receive-failure (see `man curl`).
# DO NOT call this inside `$(...)` — globals do not propagate out of
# subshells. Designed as a drop-in replacement for the previous `http_body`
# helper which discarded everything except the body.
http_probe() {
  local meta
  meta="$(curl -k -sS --max-time 10 -o "$TMP_BODY" \
    -w '%{http_code}\t%{content_type}' "$1" 2>/dev/null)"
  CURL_EXIT=$?
  HTTP_CODE="${meta%%$'\t'*}"
  HTTP_CT="${meta#*$'\t'}"
  HTTP_BODY="$(cat "$TMP_BODY" 2>/dev/null || true)"
}

# Trim a body to a single line of 80 bytes and redact 20+ char
# alphanumeric tokens (JWT / OAuth / base64 secrets / API keys). Mirrors
# the redaction shape used in scripts/testnet/health-gate.sh so the two
# probes never leak shaped secrets, even by accident.
redact_snippet() {
  printf '%s' "$1" \
    | tr -d '\n\r' \
    | tr '|' '_' \
    | sed -E 's#[A-Za-z0-9_+/=-]{20,}#[REDACTED-token]#g' \
    | head -c 80
}

# Emit a 3-column diagnostic table row capturing the last http_probe
# globals. Designed to follow the canonical OK/BLOCKER row so the
# operator sees the failure context inline (HTTP code, content-type,
# curl exit code, redacted body snippet) without re-running curl by
# hand.
add_diag_row() {
  add_summary "| ↳ | HTTP ${HTTP_CODE:-000}, content-type ${HTTP_CT:-?}, curl_exit=${CURL_EXIT:-?} | body[:80]=\`$(redact_snippet "$HTTP_BODY")\` |"
}

# Extract a string field from a JSON body via node -e. Prints empty on
# parse failure / missing key.
json_field() {
  local key="$1"
  node -e '
    let raw = "";
    process.stdin.on("data", c => raw += c);
    process.stdin.on("end", () => {
      try {
        const j = JSON.parse(raw);
        const v = j[process.argv[1]];
        if (v === null || v === undefined) return;
        console.log(typeof v === "string" ? v : JSON.stringify(v));
      } catch (_) { /* swallow */ }
    });
  ' "$key" 2>/dev/null
}

probe_health() {
  local svc="$1" url="$2" want="$3"  # want = csv of acceptable statuses
  local status diag=0
  http_probe "$url"
  if [[ -z "$HTTP_BODY" ]]; then
    add_summary "| \`$svc\` | unreachable | ❌ BLOCKER |"
    BLOCKERS+=("$svc unreachable at $url")
    diag=1
  elif [[ ! "$HTTP_CODE" =~ ^2 ]]; then
    add_summary "| \`$svc\` | http-$HTTP_CODE | ❌ BLOCKER |"
    BLOCKERS+=("$svc returned HTTP $HTTP_CODE at $url")
    diag=1
  else
    status="$(printf "%s" "$HTTP_BODY" | json_field status)"
    status="${status:-unknown}"
    case ",$want," in
      *,"$status",*)
        add_summary "| \`$svc\` | $status | ✅ OK |"
        ;;
      *)
        add_summary "| \`$svc\` | $status | ❌ BLOCKER |"
        BLOCKERS+=("$svc reported status=$status (want one of: $want)")
        diag=1
        ;;
    esac
  fi
  (( diag )) && add_diag_row
}

# ----- preflight -----

# Reject any URL that points at production. Belt-and-suspenders fence.
for url in "$PRICE_SERVICE_URL" "$ORACLE_SIGNER_URL" "$HEDGE_ENGINE_URL" \
           "$STATUS_AGGREGATOR_URL" "$LANE7_RPC"; do
  case "$url" in
    *goodswap.goodclaw.org*|*rpc.goodclaw.org*)
      echo "FATAL: lane-7 smoke must not touch production URL: $url" >&2
      exit 2
      ;;
  esac
done

# ----- 1-3. service /health probes -----

add_summary ""
add_summary "## Lane-local services"
add_summary ""
add_summary "| service | reported status | classification |"
add_summary "|---------|-----------------|----------------|"
probe_health "price-service"     "$PRICE_SERVICE_URL"   "ok"
probe_health "oracle-signer"     "$ORACLE_SIGNER_URL"   "ok,health-only"
probe_health "hedge-engine"      "$HEDGE_ENGINE_URL"    "ok,health-only"

# ----- 4. status-aggregator + contract classification -----

add_summary ""
add_summary "## status-aggregator + contract classification"
add_summary ""

http_probe "$STATUS_AGGREGATOR_URL"
agg_body="$HTTP_BODY"
agg_diag=0
if [[ -z "$agg_body" ]]; then
  add_summary "❌ status-aggregator at \`$STATUS_AGGREGATOR_URL\` returned empty body"
  BLOCKERS+=("status-aggregator unreachable at $STATUS_AGGREGATOR_URL")
  agg_diag=1
elif [[ ! "$HTTP_CODE" =~ ^2 ]]; then
  add_summary "❌ status-aggregator at \`$STATUS_AGGREGATOR_URL\` returned HTTP $HTTP_CODE"
  BLOCKERS+=("status-aggregator returned HTTP $HTTP_CODE at $STATUS_AGGREGATOR_URL")
  agg_diag=1
else
  parsed="$(printf "%s" "$agg_body" | node -e '
    let raw = "";
    process.stdin.on("data", c => raw += c);
    process.stdin.on("end", () => {
      try {
        const j = JSON.parse(raw);
        if (!Array.isArray(j.services)) { console.log("BAD"); return; }
        console.log("OK");
        for (const s of j.services) {
          console.log(`${s.name}\t${s.status||"?"}`);
        }
      } catch (_) { console.log("BAD"); }
    });
  ' 2>/dev/null)"

  if [[ "$(printf "%s" "$parsed" | head -n 1)" != "OK" ]]; then
    add_summary "❌ status-aggregator response did not parse as JSON with \`services[]\`"
    BLOCKERS+=("status-aggregator response not parseable")
    agg_diag=1
  else
    declare -A AGG_STATUS=()
    while IFS=$'\t' read -r name st; do
      [[ "$name" == "OK" || -z "$name" ]] && continue
      AGG_STATUS[$name]="$st"
    done < <(printf "%s\n" "$parsed")

    for svc in oracle-signer hedge-engine; do
      st="${AGG_STATUS[$svc]:-MISSING}"
      cls="$(awk -v s="$svc" '
        /^## / { in_excl = (index($0, "Documented exclusions") > 0) ? 1 : 0; next }
        in_excl && /^\| *`[a-zA-Z0-9_-]+` *\|/ {
          n = split($0, parts, "|"); gsub(/[ `]/, "", parts[2])
          if (parts[2] == s) { print "EXCLUDED"; exit }
        }
      ' "$HEALTH_CONTRACT")"

      add_summary "| \`$svc\` | $st | ${cls:-MISSING-FROM-CONTRACT} |"
      if [[ "$st" == "MISSING" ]]; then
        BLOCKERS+=("$svc not reported by status-aggregator")
      elif [[ -z "$cls" ]]; then
        BLOCKERS+=("$svc not classified in HEALTH-CONTRACT.md exclusions table")
      else
        WARNINGS+=("$svc classified as $cls in contract — confirm before public testnet promotion")
      fi
    done
  fi
fi
(( agg_diag )) && add_diag_row

# ----- 5. on-chain freshness -----

add_summary ""
add_summary "## On-chain oracle freshness"
add_summary ""
if [[ -z "$LANE7_RPC" ]]; then
  add_summary "⚠️  on-chain freshness check skipped — \`LANE7_RPC\` unset"
  WARNINGS+=("on-chain freshness check skipped — LANE7_RPC unset")
else
  case "$LANE7_RPC" in
    *goodswap.goodclaw.org*|*rpc.goodclaw.org*)
      add_summary "❌ \`LANE7_RPC=$LANE7_RPC\` — lane-7 must not point at production RPC"
      BLOCKERS+=("LANE7_RPC points at production RPC")
      ;;
    *)
      stock_oracle="${STOCK_ORACLE_V2_ADDRESS:-}"
      if [[ -z "$stock_oracle" ]]; then
        addr_json="$REPO_ROOT/op-stack/addresses.json"
        if [[ -f "$addr_json" ]]; then
          stock_oracle="$(node -e '
            const fs=require("fs");
            try {
              const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
              const c=j.contracts||{};
              console.log(c.StockOracleV2 || "");
            } catch (_) {}
          ' "$addr_json" 2>/dev/null)"
        fi
      fi

      if [[ -z "$stock_oracle" ]]; then
        add_summary "⚠️  StockOracleV2 address unknown — set STOCK_ORACLE_V2_ADDRESS or populate op-stack/addresses.json"
        WARNINGS+=("StockOracleV2 address unresolved — freshness probe skipped")
      else
        # Pure node + JSON-RPC eth_call (selector for lastUpdated() =
        # cast sig "lastUpdated()" = 0xd0b06f5d). Bound by a 10s socket
        # timeout that mirrors the curl `--max-time 10` policy elsewhere
        # in the script — a paused/silent RPC must not freeze the smoke
        # indefinitely. On timeout we print a `TIMEOUT` sentinel and the
        # bash side promotes it to a warning (matching the existing
        # "LANE7_RPC unset" rule). Staleness threshold breach is the
        # only blocker path; transport failure is warning-grade.
        last_updated="$(node -e '
          const http = process.argv[1].startsWith("https://") ? require("https") : require("http");
          const url = new URL(process.argv[1]);
          const data = JSON.stringify({
            jsonrpc: "2.0", id: 1, method: "eth_call",
            params: [{ to: process.argv[2], data: "0xd0b06f5d" }, "latest"],
          });
          const req = http.request({
            method: "POST", hostname: url.hostname, port: url.port,
            path: url.pathname + url.search,
            headers: { "content-type": "application/json", "content-length": Buffer.byteLength(data) },
          }, (res) => {
            let raw = "";
            res.on("data", c => raw += c);
            res.on("end", () => {
              try {
                const j = JSON.parse(raw);
                if (!j.result || j.result === "0x") { console.log("0"); return; }
                console.log(BigInt(j.result).toString());
              } catch (_) { console.log("0"); }
            });
          });
          req.on("error", () => { console.log("0"); process.exit(0); });
          req.setTimeout(10000, () => {
            req.destroy();
            console.log("TIMEOUT");
            process.exit(0);
          });
          req.write(data); req.end();
        ' "$LANE7_RPC" "$stock_oracle" 2>/dev/null)"

        last_updated="${last_updated:-0}"
        if [[ "$last_updated" == "TIMEOUT" ]]; then
          add_summary "⚠️  StockOracleV2.lastUpdated() probe timed out after 10s (\`LANE7_RPC=$LANE7_RPC\`)"
          WARNINGS+=("on-chain freshness probe timed out after 10s (LANE7_RPC=$LANE7_RPC)")
        elif [[ "$last_updated" == "0" ]]; then
          add_summary "⚠️  StockOracleV2.lastUpdated() returned 0 — fresh oracle absent (testnet candidate phase)"
          WARNINGS+=("on-chain oracle has no signer-supplied data yet")
        else
          now_s="$(date -u +%s)"
          age_s=$(( now_s - last_updated ))
          if (( age_s > STALENESS_THRESHOLD_S )); then
            add_summary "❌ StockOracleV2.lastUpdated() = $last_updated; age $age_s s > threshold $STALENESS_THRESHOLD_S s"
            BLOCKERS+=("on-chain oracle stale (age ${age_s}s > ${STALENESS_THRESHOLD_S}s)")
          else
            add_summary "✅ StockOracleV2.lastUpdated() = $last_updated; age $age_s s ≤ $STALENESS_THRESHOLD_S s"
          fi
        fi
      fi
      ;;
  esac
fi

# ----- 6. real-trading fence -----

add_summary ""
add_summary "## Real-trading fence (env-presence only — never values)"
add_summary ""

# Read .env if present; pm2 env <id> is preferred when PM2 is running but
# the lane-7 worktree is push-fenced and may not own a daemon. Operator
# can set PM2_ID_PRICE_SERVICE to feed env from a running lane-7 PM2
# entry; otherwise fall back to file inspection.
declare -A ENV_PRESENCE=()
if [[ -n "${PM2_ID_PRICE_SERVICE:-}" ]] && command -v pm2 >/dev/null 2>&1; then
  for key in REAL_TRADING_ENABLED ETORO_MODE; do
    val="$(pm2 env "$PM2_ID_PRICE_SERVICE" 2>/dev/null | awk -F': *' -v k="$key" '$1==k {print $2; exit}')"
    if [[ -n "$val" ]]; then ENV_PRESENCE[$key]="$val"; fi
  done
elif [[ -f "$LANE7_ENV_FILE" ]]; then
  while IFS='=' read -r key val; do
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    [[ "$key" == "REAL_TRADING_ENABLED" || "$key" == "ETORO_MODE" ]] || continue
    val="${val%\"}"; val="${val#\"}"; val="${val%\'}"; val="${val#\'}"
    ENV_PRESENCE[$key]="$val"
  done < "$LANE7_ENV_FILE"
fi

rte="${ENV_PRESENCE[REAL_TRADING_ENABLED]:-unset}"
mode="${ENV_PRESENCE[ETORO_MODE]:-unset}"

if [[ "$rte" == "unset" || "$rte" == "false" ]]; then
  add_summary "✅ \`REAL_TRADING_ENABLED\` = \`$rte\` (fence intact)"
else
  add_summary "❌ \`REAL_TRADING_ENABLED\` = \`$rte\` — lane-7 forbids real trading"
  BLOCKERS+=("REAL_TRADING_ENABLED is $rte — must be unset or false on the lane-7 host")
fi

case "$mode" in
  mock|demo-readonly|sandbox|demo-trading|unset)
    add_summary "✅ \`ETORO_MODE\` = \`$mode\` (within lane-7 allowlist)"
    ;;
  *)
    add_summary "❌ \`ETORO_MODE\` = \`$mode\` — lane-7 only allows {mock, demo-readonly, sandbox, demo-trading, unset}"
    BLOCKERS+=("ETORO_MODE is $mode — outside lane-7 allowlist")
    ;;
esac

# ----- verdict -----

verdict="GREEN"
exit_code=0
if (( ${#BLOCKERS[@]} > 0 )); then
  verdict="RED"
  exit_code=1
elif (( ${#WARNINGS[@]} > 0 )); then
  verdict="GREEN-with-warnings"
fi

# ----- write report -----

mkdir -p "$(dirname "$REPORT")"
{
  echo "# Lane-7 Internal Smoke Run"
  echo
  echo "_Generated by \`scripts/testnet/internal-smoke.sh\` at $(now_iso)._"
  echo
  echo "**Verdict:** \`$verdict\`  "
  echo "**Exit code:** \`$exit_code\`  "
  echo "**Lane base:** \`$LANE7_BASE\`  "
  echo "**LANE7_RPC:** \`${LANE7_RPC:-unset}\`  "
  echo
  echo "Source-of-truth contract: [\`docs/testnet/HEALTH-CONTRACT.md\`](./HEALTH-CONTRACT.md). Companion gate (production): \`scripts/testnet/health-gate.sh\`."
  echo
  if (( ${#BLOCKERS[@]} > 0 )); then
    echo "## Blockers"
    echo
    for b in "${BLOCKERS[@]}"; do echo "- BLOCKER: $b"; done
    echo
  fi
  if (( ${#WARNINGS[@]} > 0 )); then
    echo "## Warnings"
    echo
    for w in "${WARNINGS[@]}"; do echo "- WARN: $w"; done
    echo
  fi
  for line in "${SUMMARY_LINES[@]}"; do
    echo "$line"
  done
  echo
  echo "## Reproduce"
  echo
  echo '```bash'
  echo "./scripts/testnet/internal-smoke.sh"
  echo '```'
} > "$REPORT"

# ----- console summary -----

echo
echo "=========================================="
echo "  Lane-7 internal smoke — verdict: $verdict"
echo "  exit code: $exit_code"
echo "  blockers:  ${#BLOCKERS[@]}"
echo "  warnings:  ${#WARNINGS[@]}"
echo "  report:    $REPORT"
echo "=========================================="
if (( ${#BLOCKERS[@]} > 0 )); then
  printf '  BLOCKER: %s\n' "${BLOCKERS[@]}"
fi
if (( ${#WARNINGS[@]} > 0 )); then
  printf '  WARN: %s\n' "${WARNINGS[@]}"
fi
echo

exit "$exit_code"
