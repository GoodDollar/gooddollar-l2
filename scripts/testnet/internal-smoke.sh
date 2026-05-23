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
#   MIN_FRESH_QUOTES          default 1              (price-service quote-flow probe;
#                                                     minimum non-empty cache size)
#   QUOTE_MAX_AGE_S           default 600            (max age of freshest quote in seconds;
#                                                     above this is WARN, not BLOCKER)
#   PRICE_SERVICE_QUOTES_URL  override the price-service /quotes/fresh/all URL
#                              (default: derived from PRICE_SERVICE_URL)
#   LANE7_ENV_FILE            default .env at repo root
#   REPORT                    default docs/testnet/iter05-internal-smoke.md
#
# Exit semantics:
#   0  no blockers (green or green-with-warnings) AND report written
#   1  one or more blockers — operator must fix before promotion
#   2  preflight failure (bad input, missing tool, unwritable REPORT)
#   3  verdict computed but report file failed to write (disk full,
#      mount unavailable mid-run) — operator must re-run after
#      fixing the filesystem

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

# Strip credentials from a URL value before echoing into operator-visible
# surfaces (stderr, report file, console summary). Two patterns are common
# on hosted RPC providers (Alchemy / Infura / QuickNode legacy / Tenderly):
#   1. basic-auth userinfo:  https://USER:KEY@host/...
#   2. query-string secret:  https://host/...?key=...
# Both must be removed before any echo. Pure bash parameter expansion — no
# subprocess, no new tool dependency, no behavior change for credential-free
# URLs. Hoisted above the FATAL preflight at line ~140 so that path can use
# it; same helper is reused at every other site that emits LANE7_RPC's value.
redact_url_secrets() {
  local u="$1"
  u="${u%%\?*}"
  case "$u" in
    *://*@*) u="${u%%://*}://${u#*://*@}" ;;
  esac
  printf '%s' "$u"
}

# Output collectors. Declared up here so the early `.env` loader can
# push CRLF + unrecognized-key warnings into WARNINGS[] before the
# parameter-expansion defaults run.
declare -a BLOCKERS=()
declare -a WARNINGS=()
declare -a SUMMARY_LINES=()
declare -A ENV_PRESENCE=()

# Load lane-local overrides from .env BEFORE the parameter-expansion
# defaults below resolve. Implementation lives in lib/load-lane7-env.sh
# (sourced, not exec'd, so it can append to WARNINGS / ENV_PRESENCE
# in this shell). See that file's header for the allowlist + the
# shell-vs-.env precedence rule. Task 0026 + 0027 convergence.
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LANE7_ENV_FILE="${LANE7_ENV_FILE:-$REPO_ROOT/.env}"
# shellcheck source=lib/load-lane7-env.sh
. "$(dirname "$0")/lib/load-lane7-env.sh"

LANE7_BASE="${LANE7_BASE:-http://localhost}"
PRICE_SERVICE_PORT="${PRICE_SERVICE_PORT:-4000}"
ORACLE_SIGNER_PORT="${ORACLE_SIGNER_PORT:-9107}"
HEDGE_ENGINE_PORT="${HEDGE_ENGINE_PORT:-9106}"
STATUS_AGGREGATOR_PORT="${STATUS_AGGREGATOR_PORT:-9200}"

# LANE7_BASE shape preflight. The default URL templates below
# concatenate `:$PORT/health` (or `/status.json`) onto $LANE7_BASE,
# so the base must be a bare scheme+host[:port] with no trailing
# slash and no path. Trailing slash / path silently produces shapes
# like `http://localhost/:4000/health` that curl resolves against
# port 80, producing cascading 404 BLOCKERs from whatever's on the
# default port — operators chase a phantom 4-service outage when
# the real fault is one bad env var. Catch the typo here with a
# single FATAL line that names the offending variable AND points
# at the per-service `*_URL` escape hatches for path-prefix proxies.
# Skip the check if every *_URL override is set — then LANE7_BASE
# is unused, and operators with reverse-proxy setups can keep it
# as a documentary value without tripping the preflight.
if [[ -z "${PRICE_SERVICE_URL:-}" || -z "${ORACLE_SIGNER_URL:-}" \
    || -z "${HEDGE_ENGINE_URL:-}" || -z "${STATUS_AGGREGATOR_URL:-}" ]]; then
  LANE7_BASE_RE='^https?://[^:/]+(:[0-9]+)?$'
  if [[ ! "$LANE7_BASE" =~ $LANE7_BASE_RE ]]; then
    echo "FATAL: LANE7_BASE='$LANE7_BASE' must be scheme://host[:port] with no trailing slash or path" >&2
    echo "FATAL: use http://localhost (default) or override per-service via PRICE_SERVICE_URL / ORACLE_SIGNER_URL / HEDGE_ENGINE_URL / STATUS_AGGREGATOR_URL" >&2
    exit 2
  fi
  unset LANE7_BASE_RE
fi

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
unset malformed pair url
# PROBE_URL_RE intentionally stays in scope below — `LANE7_RPC` is the
# fifth URL the smoke consumes (via `new URL(...)` in the on-chain
# eth_call). Adding it to the loop above is awkward (it's optional and
# resolved later); the cleanest fix is one extra regex check after the
# LANE7_RPC resolution. If a future task introduces yet another URL
# input, validate it here too before unsetting the regex.

# REPO_ROOT and LANE7_ENV_FILE are resolved above (before the .env
# loader runs). REPORT / HEALTH_CONTRACT / STALENESS_THRESHOLD_S /
# LANE7_RPC fall through to their hardcoded defaults here when neither
# the shell nor `.env` set them — the loader's `export "$key=$val"`
# means `.env`-sourced values look identical to shell-exported ones
# at this point.
REPORT="${REPORT:-$REPO_ROOT/docs/testnet/iter05-internal-smoke.md}"
HEALTH_CONTRACT="${HEALTH_CONTRACT-$REPO_ROOT/docs/testnet/HEALTH-CONTRACT.md}"
STALENESS_THRESHOLD_S="${STALENESS_THRESHOLD_S-600}"
LANE7_RPC="${LANE7_RPC-}"

# `LANE7_RPC` is consumed by `new URL(...)` in the on-chain freshness
# probe. A malformed value (`foo`, `tcp://...`, `http://localhost:8545 `
# with a trailing space copied from chat, `http://localhost:8545\r`
# from a Windows-CRLF .env) throws synchronously inside node, the
# child exits with stderr redirected to /dev/null, stdout empty
# defaults to `"0"`, and the operator sees the misleading
# `fresh oracle absent (testnet candidate phase)` WARN — the
# expected pre-deploy signal, so they take no action. Fail fast at
# preflight with a single FATAL block, redacting any `?key=...`
# query string before echoing (some hosted RPCs put API keys there).
if [[ -n "$LANE7_RPC" ]] && [[ ! "$LANE7_RPC" =~ $PROBE_URL_RE ]]; then
  echo "FATAL: malformed LANE7_RPC — must match http(s)://host[:port][/path]" >&2
  echo "FATAL: LANE7_RPC=$(redact_url_secrets "$LANE7_RPC")" >&2
  exit 2
fi
# Optional explicit override for the quote-flow probe (task 0024). When
# unset, the probe URL is derived from PRICE_SERVICE_URL at probe time.
# When set, validate it through the same regex so a typo here fails the
# same way every other URL preflight does.
if [[ -n "${PRICE_SERVICE_QUOTES_URL:-}" ]] && [[ ! "$PRICE_SERVICE_QUOTES_URL" =~ $PROBE_URL_RE ]]; then
  echo "FATAL: malformed PRICE_SERVICE_QUOTES_URL — must match http(s)://host[:port][/path]" >&2
  echo "FATAL: PRICE_SERVICE_QUOTES_URL=$PRICE_SERVICE_QUOTES_URL" >&2
  exit 2
fi
unset PROBE_URL_RE

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

MIN_FRESH_QUOTES="${MIN_FRESH_QUOTES:-1}"
QUOTE_MAX_AGE_S="${QUOTE_MAX_AGE_S:-600}"

require_uint STALENESS_THRESHOLD_S  "$STALENESS_THRESHOLD_S"
require_uint MIN_FRESH_QUOTES       "$MIN_FRESH_QUOTES"
require_uint QUOTE_MAX_AGE_S        "$QUOTE_MAX_AGE_S"
require_uint PRICE_SERVICE_PORT     "$PRICE_SERVICE_PORT"     1 65535
require_uint ORACLE_SIGNER_PORT     "$ORACLE_SIGNER_PORT"     1 65535
require_uint HEDGE_ENGINE_PORT      "$HEDGE_ENGINE_PORT"      1 65535
require_uint STATUS_AGGREGATOR_PORT "$STATUS_AGGREGATOR_PORT" 1 65535

# Path-existence preflight for the HEALTH-CONTRACT classification table.
# The awk invocations downstream (lines ~315-323) consume `$HEALTH_CONTRACT`
# without stderr redirection, so a missing or unreadable path leaks
# `awk: fatal: cannot open file ...` to the operator's TTY *and* yields
# an empty `cls`, which fires misleading `MISSING-FROM-CONTRACT` BLOCKERs
# for both `oracle-signer` and `hedge-engine`. The operator chases a
# phantom misclassification problem instead of restoring the contract
# file. Fail fast here with a single FATAL block — symmetric with the
# tool / URL / numeric preflights above.
if [[ ! -r "$HEALTH_CONTRACT" ]]; then
  echo "FATAL: HEALTH_CONTRACT not readable at: $HEALTH_CONTRACT" >&2
  echo "FATAL: set HEALTH_CONTRACT=<path> or restore docs/testnet/HEALTH-CONTRACT.md" >&2
  exit 2
fi

# REPORT path preflight. The Markdown report is the lane-7 promotion
# artifact; an unwritable path silently strands the smoke's evidence
# and gives the operator a false-green console line ("report: <path>"
# while no file exists). Operator pastes the path into the promotion
# ticket; reviewer sees stale content from yesterday or no file at
# all. Symmetric with the other preflights (0008/9/13/14/15/19) —
# fail fast with a single FATAL line that names the offending case.
# Touch-then-truncate happens at write time below; here we only
# validate the path is usable so probes don't run against an
# unwritable target.
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
  # Drop any prior probe's body so transport-level failures
  # (curl_exit ≠ 0, e.g. connection refused / DNS / timeout) don't
  # leak the previous probe's response into this probe's diag row.
  # `curl -o "$TMP_BODY"` opens the file lazily on the first response
  # byte; failures before any response leave the file untouched.
  : > "$TMP_BODY"
  local meta
  meta="$(curl -k -sS --max-time 10 -o "$TMP_BODY" \
    -w '%{http_code}\t%{content_type}' "$1" 2>/dev/null)"
  CURL_EXIT=$?
  HTTP_CODE="${meta%%$'\t'*}"
  HTTP_CT="${meta#*$'\t'}"
  # Belt-and-suspenders: if curl reported any error, don't trust the
  # tempfile contents — a future curl version could short-write `-o`
  # output even after our truncate (e.g. partial chunked response).
  if (( CURL_EXIT == 0 )); then
    HTTP_BODY="$(cat "$TMP_BODY" 2>/dev/null || true)"
  else
    HTTP_BODY=""
  fi
}

# Trim a body to 80 codepoints (not bytes) and redact 20+ char
# alphanumeric tokens (JWT / OAuth / base64 secrets / API keys).
# The final stage uses node so the snippet is always valid UTF-8
# regardless of LANG / mawk-vs-gawk on the host: a `head -c 80`
# byte cut would split multi-byte codepoints (emoji, accented
# Latin, CJK) and render as `�` in any reader. `Array.from(str)`
# iterates by Unicode scalar value (surrogate pairs handled
# correctly), so non-BMP emoji stay intact. Node is already on the
# preflight tool list — no new dependency.
redact_snippet() {
  printf '%s' "$1" \
    | tr -d '\n\r' \
    | tr '|' '_' \
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

# Escape bytes that break Markdown table-cell rendering. Untrusted
# strings (response `status` field, status-aggregator status, server-
# controlled `Content-Type` header) are substituted into 3-cell rows
# verbatim today; a single `|` in the value silently splits the row
# into 5+ cells, a backtick breaks the inline code span, a newline
# produces an orphan fragment that breaks the table. Convergence:
#   `|`  -> `\|`         (Markdown-escaped cell delimiter)
#   '`'  -> `'`          (downgrade to apostrophe — `\`` would still
#                         be parsed as a span opener in some renderers)
#   CR   -> ''           (drop lone CR / CRLF row terminator)
#   LF   -> ' '          (preserve readability, single-line cell)
# Use ONLY in Markdown row cells. BLOCKERS[] / WARNINGS[] / console
# echoes keep the raw value so operators see the original payload.
# `sed` is already an implicit dependency (redact_snippet uses it).
escape_md_cell() {
  printf '%s' "$1" \
    | tr -d '\r' \
    | tr '\n' ' ' \
    | sed -e 's/|/\\|/g' -e "s/\`/'/g"
}

# Emit a 3-column diagnostic table row capturing the last http_probe
# globals. Designed to follow the canonical OK/BLOCKER row so the
# operator sees the failure context inline (HTTP code, content-type,
# curl exit code, redacted body snippet) without re-running curl by
# hand. `Content-Type` is server-controlled and routes through
# escape_md_cell so a `;` / `|` / unusual byte in it can't reshape
# the row.
add_diag_row() {
  local ct_md body_md
  ct_md="$(escape_md_cell "${HTTP_CT:-?}")"
  # `redact_snippet` only strips CR/LF, downgrades pipes, redacts
  # tokens, and codepoint-truncates — it does NOT escape backticks.
  # A body containing backticks (Express error pages, Node stack
  # traces, JSON quoting identifiers) breaks the inline code span
  # the snippet lives in, fragmenting the diag row into
  # code+prose+code in any GFM renderer. `escape_md_cell` already
  # handles backticks (` -> '); reuse it as the single Markdown-
  # escape stop for the body cell (task 0021 / 0018 convergence).
  body_md="$(escape_md_cell "$(redact_snippet "$HTTP_BODY")")"
  add_summary "| ↳ | HTTP ${HTTP_CODE:-000}, content-type $ct_md, curl_exit=${CURL_EXIT:-?} | body[:80]=\`$body_md\` |"
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
    # Markdown row uses the escaped form; BLOCKERS[] keeps the raw
    # value so operators see the unmodified payload in the console.
    local status_md
    status_md="$(escape_md_cell "$status")"
    case ",$want," in
      *,"$status",*)
        add_summary "| \`$svc\` | $status_md | ✅ OK |"
        ;;
      *)
        add_summary "| \`$svc\` | $status_md | ❌ BLOCKER |"
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
      echo "FATAL: lane-7 smoke must not touch production URL: $(redact_url_secrets "$url")" >&2
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
# Capture price-service /health body and reachability immediately,
# before subsequent probes mutate the http_probe globals. The
# quote-flow section (task 0024) needs the original body to surface
# the `configured symbols / cached / fresh` breakdown when count=0,
# and uses reachability + body shape to decide whether to probe
# /quotes/fresh/all at all (existing proof drivers point at generic
# /health stubs that don't have a /quotes endpoint).
price_service_health_body="$HTTP_BODY"
price_service_health_code="$HTTP_CODE"
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
      ' "$HEALTH_CONTRACT" 2>/dev/null)"

      st_md="$(escape_md_cell "$st")"
      add_summary "| \`$svc\` | $st_md | ${cls:-MISSING-FROM-CONTRACT} |"
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

# ----- 4b. price-service quote flow -----
#
# The spec's URGENT OVERRIDE banner requires the smoke prove
# "price-service reachable and serving non-empty normalized quotes",
# but /health short-circuits to `status: ok` whenever `cache.size === 0`
# (deliberate service-aliveness signal). This section probes
# /quotes/fresh/all directly and asserts a non-empty, fresh cache —
# the actual mission deliverable.
#
# Auto-skip rules: we only probe quotes when the operator either set
# an explicit PRICE_SERVICE_QUOTES_URL override, or the prior /health
# response was a real lane-7 price-service shape (contains the
# `freshQuotes` field). Generic /health stubs used by the existing
# proof drivers fall through to a skip note instead of producing a
# spurious "endpoint missing" BLOCKER.

add_summary ""
add_summary "## Price-service quote flow"
add_summary ""

quotes_url_override="${PRICE_SERVICE_QUOTES_URL:-}"
if [[ -n "$quotes_url_override" ]]; then
  quote_flow_url="$quotes_url_override"
  quote_flow_should_probe=1
elif [[ -z "$price_service_health_body" ]]; then
  add_summary "ℹ️  skipped — price-service /health was not reachable above (see lane-local services table)"
  quote_flow_should_probe=0
elif [[ ! "$price_service_health_code" =~ ^2 ]]; then
  add_summary "ℹ️  skipped — price-service /health returned HTTP $price_service_health_code (see lane-local services table)"
  quote_flow_should_probe=0
elif [[ "$price_service_health_body" != *'"freshQuotes"'* ]]; then
  add_summary "ℹ️  skipped — \`$PRICE_SERVICE_URL\` does not look like the lane-7 price-service shape (no \`freshQuotes\` field); set \`PRICE_SERVICE_QUOTES_URL\` to opt in explicitly"
  quote_flow_should_probe=0
else
  quote_flow_url="${PRICE_SERVICE_URL%/health}/quotes/fresh/all"
  quote_flow_should_probe=1
fi

if (( quote_flow_should_probe )); then
  add_summary "| metric | value | classification |"
  add_summary "|--------|-------|----------------|"
  http_probe "$quote_flow_url"
  qf_diag=0
  if [[ -z "$HTTP_BODY" ]]; then
    add_summary "| fresh quote count | unreachable | ❌ BLOCKER |"
    BLOCKERS+=("price-service /quotes/fresh/all unreachable at $quote_flow_url")
    qf_diag=1
  elif [[ ! "$HTTP_CODE" =~ ^2 ]]; then
    add_summary "| fresh quote count | http-$HTTP_CODE | ❌ BLOCKER |"
    BLOCKERS+=("price-service /quotes/fresh/all returned HTTP $HTTP_CODE at $quote_flow_url")
    qf_diag=1
  else
    # One node -e call parses the count, freshest quote ts (ms), and the
    # first quote's source. Tab-delimited output keeps the bash side
    # simple. BAD signals a parse failure or missing fields.
    qf_parsed="$(printf '%s' "$HTTP_BODY" | node -e '
      let raw = "";
      process.stdin.on("data", c => raw += c);
      process.stdin.on("end", () => {
        try {
          const j = JSON.parse(raw);
          if (typeof j.count !== "number" || !Array.isArray(j.quotes)) {
            console.log("BAD"); return;
          }
          let freshestTs = 0;
          for (const q of j.quotes) {
            const ts = q && (typeof q.ts === "number" ? q.ts : q.timestamp);
            if (typeof ts === "number" && ts > freshestTs) freshestTs = ts;
          }
          let firstSource = "";
          if (j.quotes.length > 0 && j.quotes[0] && j.quotes[0].source) {
            firstSource = String(j.quotes[0].source);
          }
          console.log("OK\t" + j.count + "\t" + freshestTs + "\t" + firstSource);
        } catch (_) { console.log("BAD"); }
      });
    ' 2>/dev/null)"

    if [[ "$qf_parsed" != OK$'\t'* ]]; then
      add_summary "| fresh quote count | unparseable response | ❌ BLOCKER |"
      BLOCKERS+=("price-service /quotes/fresh/all response did not parse as JSON with \`count\` and \`quotes[]\`")
      qf_diag=1
    else
      IFS=$'\t' read -r _ qf_count qf_freshest_ms qf_source <<<"$qf_parsed"
      qf_source_md="$(escape_md_cell "$qf_source")"
      if (( qf_count < MIN_FRESH_QUOTES )); then
        add_summary "| fresh quote count | $qf_count / min $MIN_FRESH_QUOTES | ❌ BLOCKER |"
        BLOCKERS+=("price-service has no fresh quotes (count=$qf_count, min=$MIN_FRESH_QUOTES)")
        cfg_n=$(printf '%s' "$price_service_health_body" | json_field configuredSymbols)
        cache_n=$(printf '%s' "$price_service_health_body" | json_field totalCached)
        fresh_n=$(printf '%s' "$price_service_health_body" | json_field freshQuotes)
        add_summary "| ↳ | configured symbols: ${cfg_n:-?}; cached: ${cache_n:-?}; fresh: ${fresh_n:-?} | (filter rejecting all or upstream stale) |"
      else
        add_summary "| fresh quote count | $qf_count / min $MIN_FRESH_QUOTES | ✅ OK |"
        # Compute freshest quote age in seconds (clamp negatives to 0).
        now_ms=$(($(date -u +%s) * 1000))
        if (( qf_freshest_ms > 0 )); then
          age_ms=$(( now_ms - qf_freshest_ms ))
          (( age_ms < 0 )) && age_ms=0
          age_s=$(( age_ms / 1000 ))
        else
          age_s=-1
        fi
        if (( age_s < 0 )); then
          add_summary "| freshest quote age | unknown (\`ts\`/\`timestamp\` missing on quotes) | ⚠️  WARN |"
          WARNINGS+=("price-service /quotes/fresh/all responses missing per-quote \`ts\`/\`timestamp\` — cannot assess freshness")
        elif (( age_s > QUOTE_MAX_AGE_S )); then
          add_summary "| freshest quote age | ${age_s} s > ${QUOTE_MAX_AGE_S} s | ⚠️  WARN |"
          WARNINGS+=("freshest quote is ${age_s}s old (max ${QUOTE_MAX_AGE_S}s)")
        else
          add_summary "| freshest quote age | ${age_s} s ≤ ${QUOTE_MAX_AGE_S} s | ✅ OK |"
        fi
        if [[ -n "$qf_source" ]]; then
          add_summary "| source (first quote) | \`$qf_source_md\` | ✅ OK |"
        fi
      fi
    fi
  fi
  (( qf_diag )) && add_diag_row
fi

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
      add_summary "❌ \`LANE7_RPC=$(redact_url_secrets "$LANE7_RPC")\` — lane-7 must not point at production RPC"
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

      # Normalize + validate the resolved address shape. An invalid value
      # (typo, wrong JSON type, trailing whitespace/CRLF copied from chat
      # or a Windows-line-endinged .env) makes the JSON-RPC `eth_call`
      # reject with `invalid argument 0`. The node side maps that to
      # `last_updated == 0`, which the bash side prints as the misleading
      # "fresh oracle absent (testnet candidate phase)" WARN — same
      # message the operator would see for a genuinely-pre-deploy testnet,
      # so they take no action while their oracle is actually writing
      # fine and the smoke is just calling the wrong address. Strip
      # whitespace + CR, regex-check the canonical 0x[40 hex] shape,
      # WARN-and-skip on mismatch (NOT BLOCKER — testnet candidate phase
      # explicitly tolerates a missing/unresolved oracle address).
      if [[ -n "$stock_oracle" ]]; then
        stock_oracle="${stock_oracle%$'\r'}"
        stock_oracle="${stock_oracle#"${stock_oracle%%[![:space:]]*}"}"
        stock_oracle="${stock_oracle%"${stock_oracle##*[![:space:]]}"}"
        if [[ ! "$stock_oracle" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
          # Redact: keep at most 10 chars of the input + length suffix so
          # a partial typo is hinted at without copying a long
          # secret-shaped string into the report.
          shape="${stock_oracle:0:10}…(${#stock_oracle} chars)"
          add_summary "⚠️  STOCK_ORACLE_V2_ADDRESS does not look like a 0x-prefixed 20-byte hex address (shape: \`$shape\`) — on-chain freshness skipped"
          WARNINGS+=("STOCK_ORACLE_V2_ADDRESS shape invalid (\`$shape\`) — set a 0x-prefixed 40-hex address")
          stock_oracle=""
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
          // Belt-and-suspenders for inputs that pass the bash preflight
          // regex but still throw inside `new URL` (e.g. a future locale-
          // specific host class). Print the BADURL sentinel and exit 0
          // so the bash side can branch the same way it handles TIMEOUT.
          let url;
          try { url = new URL(process.argv[1]); }
          catch (_) { console.log("BADURL"); process.exit(0); }
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
              // Five distinct outcomes — collapsing all of them
              // into "0" hides four operationally distinct
              // failure modes from operators reading the report
              // at promotion time. Sentinel shape mirrors the
              // established BADURL (task 0015) / TIMEOUT (0010)
              // conventions. The bash side branches on each.
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
                if (j && j.result === "0x") {
                  console.log("0");
                  return;
                }
                if (!j || j.result === undefined || j.result === null) {
                  console.log("NORESULT");
                  return;
                }
                console.log(BigInt(j.result).toString());
              } catch (_) { console.log("PARSEFAIL"); }
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
        rpc_redacted="$(redact_url_secrets "$LANE7_RPC")"
        if [[ "$last_updated" == "BADURL" ]]; then
          add_summary "⚠️  \`LANE7_RPC=$rpc_redacted\` failed URL parsing in node — on-chain freshness skipped"
          WARNINGS+=("LANE7_RPC failed URL parsing (LANE7_RPC=$rpc_redacted)")
        elif [[ "$last_updated" == "TIMEOUT" ]]; then
          add_summary "⚠️  StockOracleV2.lastUpdated() probe timed out after 10s (\`LANE7_RPC=$rpc_redacted\`)"
          WARNINGS+=("on-chain freshness probe timed out after 10s (LANE7_RPC=$rpc_redacted)")
        elif [[ "$last_updated" == RPCERR:* ]]; then
          # `RPCERR:<code>:<message>` from the node-side parser. Server
          # said the call itself is wrong — wrong contract address /
          # wrong RPC endpoint / chain in a state where eth_call
          # rejects. None of these are "testnet candidate phase";
          # surface as BLOCKER with the server's message so the
          # operator can pick the lever to pull.
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
        elif [[ "$last_updated" == "0" ]]; then
          add_summary "⚠️  StockOracleV2.lastUpdated() returned 0 — fresh oracle absent (testnet candidate phase)"
          WARNINGS+=("on-chain oracle has no signer-supplied data yet")
        else
          now_s="$(date -u +%s)"
          age_s=$(( now_s - last_updated ))
          if (( age_s < 0 )); then
            # Future-dated lastUpdated() — `age_s > THRESHOLD` would silently
            # return false on the negative value and print a contradictory
            # `✅ ... age -86400 s ≤ 600 s` line. Surface the anomaly as a
            # WARN (matches "no signer data yet" / probe-timeout grading)
            # so an operator with clock skew on their host can still make
            # forward progress while spotting the drift. BLOCKER would be
            # too brittle for a 1 s NTP wobble.
            future_s=$(( -age_s ))
            add_summary "⚠️  StockOracleV2.lastUpdated() = $last_updated is ${future_s}s in the future — check signer host clock / NTP"
            WARNINGS+=("on-chain oracle timestamp is ${future_s}s in the future (LANE7_RPC=$rpc_redacted)")
          elif (( age_s > STALENESS_THRESHOLD_S )); then
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

# pm2 env <id> is preferred when PM2 is running because it reflects the
# live process environment, not the on-disk `.env` file. The lane-7
# worktree is push-fenced and may not own a daemon — when
# PM2_ID_PRICE_SERVICE is unset, the .env-file values populated by the
# early loader at the top of the script (REAL_TRADING_ENABLED /
# ETORO_MODE → ENV_PRESENCE[]) are already in place.
if [[ -n "${PM2_ID_PRICE_SERVICE:-}" ]] && command -v pm2 >/dev/null 2>&1; then
  for key in REAL_TRADING_ENABLED ETORO_MODE; do
    val="$(pm2 env "$PM2_ID_PRICE_SERVICE" 2>/dev/null | awk -F': *' -v k="$key" '$1==k {print $2; exit}')"
    if [[ -n "$val" ]]; then ENV_PRESENCE[$key]="$val"; fi
  done
fi

rte="${ENV_PRESENCE[REAL_TRADING_ENABLED]:-unset}"
mode="${ENV_PRESENCE[ETORO_MODE]:-unset}"

# Sanitize for the report's inline-code spans. The raw value stays in
# BLOCKERS[] (terminal echo is byte-faithful via `printf '%s'`) and
# the case-match below tests the raw value so an operator who types
# `ETORO_MODE=demo|readonly` still hits the * branch and gets the
# BLOCKER they deserve. escape_md_cell downgrades `\`` → `'`,
# escapes `|` → `\|`, drops CR, and turns LF into space — exactly
# the chars that break inline-code spans in summary lines.
# (Task 0018 / 0021 convergence — closes the env-source scope-out.)
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

# Parent directory was preflighted above; recreating here is a no-op
# guard against a concurrent process having deleted it between
# preflight and write. Capture the redirect's exit status so a
# mid-write failure (disk full, FUSE unmount, race-deleted parent)
# becomes a non-zero exit instead of a false-green console line.
mkdir -p "$(dirname "$REPORT")"
report_write_ok=1
{
  echo "# Lane-7 Internal Smoke Run"
  echo
  echo "_Generated by \`scripts/testnet/internal-smoke.sh\` at $(now_iso)._"
  echo
  echo "**Verdict:** \`$verdict\`  "
  echo "**Exit code:** \`$exit_code\`  "
  echo "**Lane base:** \`$LANE7_BASE\`  "
  echo "**LANE7_RPC:** \`$(redact_url_secrets "${LANE7_RPC:-unset}")\`  "
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
} > "$REPORT" || report_write_ok=0

# A successful redirect can still produce an empty file if the first
# `echo` failed mid-stream (open succeeded but write hit ENOSPC).
# Treat both signals — captured failure status AND zero-size file —
# as a mid-write failure. Exit code 3 distinguishes "verdict
# computed but artifact missing" from the verdict-grade {0, 1} and
# preflight-grade {2}.
if (( ! report_write_ok )) || [[ ! -s "$REPORT" ]]; then
  echo "FATAL: failed to write smoke report: $REPORT (disk full? mount unavailable?)" >&2
  exit 3
fi

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
