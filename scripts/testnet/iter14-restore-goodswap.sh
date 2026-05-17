#!/usr/bin/env bash
# Iter 14 — Restore goodswap.goodclaw.org after a corrupted `next build`.
#
# Why this script exists
# ----------------------
# The mandatory iter14 visual sweep found the production site at
# https://goodswap.goodclaw.org serving HTTP 500 with `Content-Type:
# text/html` for every /_next/static/* asset, while the page HTML itself
# returned 200. Pages rendered as a stream of unstyled text; no JS bundle
# ever executed.
#
# Root cause (full trail in `.autobuilder/screenshots/iter14/_findings.md`):
#   1. PM2 `goodswap` started at 20:41 UTC with a valid previous build,
#      holding the app + static-asset manifest in memory.
#   2. Between 20:59 and 21:00 UTC a `next build` ran in-place inside
#      frontend/. Every file in `.next/` now timestamps to 20:59.
#   3. That build aborted partway through: `.next/BUILD_ID` does not
#      exist, `.next/static/development/` (a dev-only artefact) was left
#      behind alongside a partial `static/chunks/` tree.
#   4. `postbuild-reload-pm2.mjs` correctly refused to reload PM2 with a
#      missing BUILD_ID — but the destructive `next build` had already
#      wiped the asset hashes the running PM2 process was pointing at.
#   5. The live process kept its in-memory manifest, but every static
#      asset URL it served now returned 500 from disk.
#
# What this script does
# ---------------------
# A one-shot recovery: produce a complete `.next/` with a valid BUILD_ID,
# manually reload PM2 only after we have proven the build is good, then
# verify a real /_next/static/css asset returns 200 with text/css from
# the live socket.
#
# Phase B (frontend/scripts/atomic-build.mjs) makes this defect class
# structurally impossible on future builds; this script is the documented
# manual fallback if the atomic wrapper itself ever needs to be bypassed.
#
# Env overrides
# -------------
#   FRONTEND_DIR    — default: <repo>/frontend
#   PM2_APP_NAME    — default: goodswap
#   LIVE_PORT       — default: 3100
#   REPORT          — default: <repo>/docs/testnet/iter14-restore-goodswap.md
#   SKIP_BUILD=1    — assume `.next/BUILD_ID` already valid, only reload + verify
#   SKIP_PM2_RELOAD_PROBE=1 — used by tests; bypasses the live curl check
#
# Tracking:
#   .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
#     0015-iter14-blocker-frontend-build-atomic-swap.md
#
# `set -u` only — `set -e` is intentionally OFF so a failure in one stage
# still produces a useful report instead of an empty bash exit.

set -u

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
FRONTEND_DIR="${FRONTEND_DIR:-${ROOT_DIR}/frontend}"
PM2_APP_NAME="${PM2_APP_NAME:-goodswap}"
LIVE_PORT="${LIVE_PORT:-3100}"
REPORT="${REPORT:-${ROOT_DIR}/docs/testnet/iter14-restore-goodswap.md}"

mkdir -p "$(dirname -- "$REPORT")"
BUILD_LOG="$(mktemp)"
RELOAD_LOG="$(mktemp)"
HTML_SAMPLE="$(mktemp)"
ASSET_HEADERS="$(mktemp)"
trap 'rm -f "$BUILD_LOG" "$RELOAD_LOG" "$HTML_SAMPLE" "$ASSET_HEADERS"' EXIT

stamp()      { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
commit_sha() { git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || echo "unknown"; }

LIVE_URL="http://127.0.0.1:${LIVE_PORT}"

# ---------- 1. Record current PM2 pid (postmortem trail) ---------------------

PRE_PID="$(pm2 jlist 2>/dev/null \
  | python3 -c "import sys,json;
data=json.load(sys.stdin) if sys.stdin else []
hit=[a for a in data if a.get('name')=='${PM2_APP_NAME}']
print(hit[0].get('pid','')) if hit else print('')" 2>/dev/null || echo "")"
PRE_PID="${PRE_PID:-unknown}"
echo "[iter14-restore] PM2 ${PM2_APP_NAME} pid before restore: ${PRE_PID}"

# ---------- 2. Build into .next/ with reload suppressed ----------------------

BUILD_VERDICT="SKIP"
BUILD_RC=0
BUILD_DURATION="—"

if [ "${SKIP_BUILD:-0}" = "1" ]; then
  echo "[iter14-restore] SKIP_BUILD=1 — assuming .next/BUILD_ID already valid"
  printf '(skipped)\n' >"$BUILD_LOG"
else
  echo "[iter14-restore] running: cd ${FRONTEND_DIR} && SKIP_PM2_RELOAD=1 npm run build"
  build_start=$(date +%s)
  ( cd "$FRONTEND_DIR" && SKIP_PM2_RELOAD=1 npm run build ) >"$BUILD_LOG" 2>&1
  BUILD_RC=$?
  build_end=$(date +%s)
  BUILD_DURATION="$((build_end - build_start))s"
  if [ "$BUILD_RC" -eq 0 ]; then BUILD_VERDICT="GREEN"; else BUILD_VERDICT="RED"; fi
fi

# ---------- 3. Assertions: BUILD_ID + at least one CSS chunk -----------------

BUILD_ID_FILE="${FRONTEND_DIR}/.next/BUILD_ID"
NEW_BUILD_ID="(missing)"
ASSERT_BUILD_ID="RED"
ASSERT_CSS="RED"
CSS_SAMPLE=""

if [ -s "$BUILD_ID_FILE" ]; then
  NEW_BUILD_ID="$(cat "$BUILD_ID_FILE")"
  ASSERT_BUILD_ID="GREEN"
fi

# Locate first CSS asset on disk (use the deepest match — `next build` writes
# to .next/static/css/*.css).
CSS_SAMPLE="$(find "${FRONTEND_DIR}/.next/static/css" -name '*.css' -type f 2>/dev/null | head -1)"
if [ -n "$CSS_SAMPLE" ] && [ -s "$CSS_SAMPLE" ]; then
  ASSERT_CSS="GREEN"
fi

# Bail before we ever touch PM2 if the build did not produce a usable bundle.
if [ "$ASSERT_BUILD_ID" != "GREEN" ] || [ "$ASSERT_CSS" != "GREEN" ]; then
  cat >"$REPORT" <<EOF
# Iter 14 — Restore goodswap (FAIL)

_Generated: $(stamp) · commit: $(commit_sha) · runner: scripts/testnet/iter14-restore-goodswap.sh_

## Verdict: RED — build did not produce a usable bundle

| Check                | Verdict | Detail |
|----------------------|---------|--------|
| BUILD_ID present     | ${ASSERT_BUILD_ID} | ${BUILD_ID_FILE} |
| CSS chunk present    | ${ASSERT_CSS} | ${CSS_SAMPLE:-(none found)} |
| Build exit code      | ${BUILD_RC} | duration=${BUILD_DURATION} |

**PM2 was NOT reloaded** — the live process is still serving whatever it
had in memory before this run. Inspect \`$BUILD_LOG\` tail below, fix
the source issue, then re-run.

## Build tail

\`\`\`text
$(tail -n 60 "$BUILD_LOG")
\`\`\`
EOF
  printf '\n=========================================================\n'
  printf '  Iter 14 — restore goodswap — verdict: RED (build failed)\n'
  printf '  BUILD_ID:    %s\n' "$ASSERT_BUILD_ID"
  printf '  CSS chunk:   %s\n' "$ASSERT_CSS"
  printf '  report:      %s\n' "$REPORT"
  printf '=========================================================\n'
  exit 1
fi

# ---------- 4. Reload PM2 -----------------------------------------------------

RELOAD_VERDICT="SKIP"
RELOAD_RC=0
if pm2 jlist 2>/dev/null | grep -q "\"name\":\"${PM2_APP_NAME}\""; then
  echo "[iter14-restore] reloading pm2 app: ${PM2_APP_NAME}"
  pm2 reload "${PM2_APP_NAME}" --update-env >"$RELOAD_LOG" 2>&1
  RELOAD_RC=$?
  if [ "$RELOAD_RC" -eq 0 ]; then RELOAD_VERDICT="GREEN"; else RELOAD_VERDICT="RED"; fi
else
  echo "[iter14-restore] pm2 app ${PM2_APP_NAME} not registered — skipping reload" >"$RELOAD_LOG"
  RELOAD_VERDICT="SKIP"
fi

# ---------- 5. Poll the live socket until it returns 200 ---------------------

HEALTH_VERDICT="SKIP"
HEALTH_STATUS="000"
if [ "${SKIP_PM2_RELOAD_PROBE:-0}" != "1" ] && [ "$RELOAD_VERDICT" != "RED" ]; then
  echo "[iter14-restore] polling ${LIVE_URL} for HTTP 200 (15s budget)"
  health_deadline=$(($(date +%s) + 15))
  while [ "$(date +%s)" -lt "$health_deadline" ]; do
    HEALTH_STATUS="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "${LIVE_URL}/" 2>/dev/null || echo 000)"
    if [ "$HEALTH_STATUS" = "200" ]; then break; fi
    sleep 1
  done
  if [ "$HEALTH_STATUS" = "200" ]; then HEALTH_VERDICT="GREEN"; else HEALTH_VERDICT="RED"; fi
fi

# ---------- 6. Pick a real CSS asset from the live HTML and HEAD-probe it ----

ASSET_VERDICT="SKIP"
ASSET_PATH=""
ASSET_STATUS="000"
ASSET_CT=""
if [ "$HEALTH_VERDICT" = "GREEN" ]; then
  curl -sS --max-time 5 "${LIVE_URL}/" -o "$HTML_SAMPLE" || true
  # Pick the first /_next/static/css/<hash>.css href referenced from the live HTML
  ASSET_PATH="$(grep -oE '/_next/static/css/[a-f0-9]+\.css' "$HTML_SAMPLE" | head -1 || true)"
  if [ -n "$ASSET_PATH" ]; then
    curl -sSI --max-time 5 "${LIVE_URL}${ASSET_PATH}" -o "$ASSET_HEADERS" || true
    # First line is the status line, e.g. `HTTP/1.1 200 OK`
    ASSET_STATUS="$(head -1 "$ASSET_HEADERS" | awk '{print $2}' || echo 000)"
    ASSET_CT="$(awk -F': ' 'tolower($1)=="content-type" {print $2; exit}' "$ASSET_HEADERS" | tr -d '\r')"
    if [ "$ASSET_STATUS" = "200" ] && echo "$ASSET_CT" | grep -qi "text/css"; then
      ASSET_VERDICT="GREEN"
    else
      ASSET_VERDICT="RED"
    fi
  else
    ASSET_VERDICT="RED"  # live HTML has no /_next/static/css href — that itself is wrong
  fi
fi

# ---------- 7. Overall verdict + report -------------------------------------

OVERALL="GREEN"
[ "$BUILD_VERDICT" = "RED" ] && OVERALL="RED"
[ "$RELOAD_VERDICT" = "RED" ] && OVERALL="RED"
[ "$HEALTH_VERDICT" = "RED" ] && OVERALL="RED"
[ "$ASSET_VERDICT" = "RED" ]  && OVERALL="RED"

POST_PID="$(pm2 jlist 2>/dev/null \
  | python3 -c "import sys,json;
data=json.load(sys.stdin) if sys.stdin else []
hit=[a for a in data if a.get('name')=='${PM2_APP_NAME}']
print(hit[0].get('pid','')) if hit else print('')" 2>/dev/null || echo "")"
POST_PID="${POST_PID:-unknown}"

{
  printf '# Iter 14 — Restore goodswap\n\n'
  printf '_Generated: %s · commit: %s · runner: scripts/testnet/iter14-restore-goodswap.sh_\n\n' \
    "$(stamp)" "$(commit_sha)"

  printf '## Verdict: %s\n\n' "$OVERALL"

  printf '| Stage           | Verdict | Detail |\n'
  printf '|-----------------|---------|--------|\n'
  printf '| Build           | %s | rc=%s duration=%s SKIP_PM2_RELOAD=1 |\n' "$BUILD_VERDICT" "$BUILD_RC" "$BUILD_DURATION"
  printf '| Assert BUILD_ID | %s | %s |\n' "$ASSERT_BUILD_ID" "${NEW_BUILD_ID}"
  printf '| Assert CSS file | %s | %s |\n' "$ASSERT_CSS" "${CSS_SAMPLE#${FRONTEND_DIR}/}"
  printf '| PM2 reload      | %s | rc=%s pre_pid=%s post_pid=%s |\n' "$RELOAD_VERDICT" "$RELOAD_RC" "$PRE_PID" "$POST_PID"
  printf '| Live health     | %s | curl %s/ → %s |\n' "$HEALTH_VERDICT" "$LIVE_URL" "$HEALTH_STATUS"
  printf '| Live asset      | %s | %s → status=%s ct=%s |\n' "$ASSET_VERDICT" "${ASSET_PATH:-(none)}" "$ASSET_STATUS" "${ASSET_CT:-(none)}"
  printf '\n'

  printf '## Build tail\n\n'
  printf '```text\n%s\n```\n\n' "$(tail -n 30 "$BUILD_LOG")"

  printf '## PM2 reload output\n\n'
  printf '```text\n%s\n```\n\n' "$(cat "$RELOAD_LOG" 2>/dev/null || echo '(no output)')"

  if [ -s "$ASSET_HEADERS" ]; then
    printf '## Live asset HEAD response\n\n'
    printf '```text\n%s\n```\n\n' "$(cat "$ASSET_HEADERS")"
  fi

  printf '## Re-running locally\n\n'
  printf '```bash\n'
  printf '# full restore (~30-60s, runs next build)\n'
  printf 'bash scripts/testnet/iter14-restore-goodswap.sh\n\n'
  printf '# reload + verify only (existing .next/ assumed good)\n'
  printf 'SKIP_BUILD=1 bash scripts/testnet/iter14-restore-goodswap.sh\n'
  printf '```\n'
} >"$REPORT"

# ---------- 8. One-screen terminal summary -----------------------------------

printf '\n=========================================================\n'
printf '  Iter 14 — restore goodswap — verdict: %s\n' "$OVERALL"
printf '  build:       %-5s (rc=%s, %s)\n' "$BUILD_VERDICT" "$BUILD_RC" "$BUILD_DURATION"
printf '  BUILD_ID:    %s\n' "$NEW_BUILD_ID"
printf '  pm2 reload:  %-5s (pid %s → %s)\n' "$RELOAD_VERDICT" "$PRE_PID" "$POST_PID"
printf '  live /:      %-5s (status=%s)\n' "$HEALTH_VERDICT" "$HEALTH_STATUS"
printf '  live asset:  %-5s (status=%s ct=%s)\n' "$ASSET_VERDICT" "$ASSET_STATUS" "${ASSET_CT:-(none)}"
printf '  report:      %s\n' "$REPORT"
printf '=========================================================\n'

[ "$OVERALL" = "GREEN" ] || exit 1
exit 0
