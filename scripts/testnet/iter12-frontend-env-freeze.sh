#!/usr/bin/env bash
# Iter 12 runner — Frontend env freeze.
#
# Goal: prove the production Next.js client bundle contains zero stray
# `localhost`, `127.0.0.1`, or `0.0.0.0` references outside the narrow
# allowlist documented in `scripts/testnet/check-bundle-no-localhost.sh`.
#
# Pipeline:
#   1. BEFORE — run the bundle gate against whatever `.next` is currently
#      on disk. Captured as a baseline so the report can show that the
#      previous build was leaking `localhost`.
#   2. BUILD  — run `npm run build` in frontend/. The repo's `postbuild`
#      hook reloads the live `goodswap` PM2 process, so a green build
#      also rolls the public site forward.
#   3. AFTER  — re-run the bundle gate against the fresh `.next`.
#      Expected verdict: GREEN (zero disallowed hits).
#   4. SMOKE  — fetch the public `/testnet-guide` page and grep the
#      rendered HTML for `localhost`. Expected: zero matches.
#
# Pure orchestration. Source-level fixes live in
#   - frontend/src/app/(app)/testnet-guide/page.tsx
#   - frontend/src/lib/usePerpsHistory.ts
#
# `set -u` only — `set -e` is intentionally OFF so failures in one stage
# don't hide the diagnostic value of the other stages.
#
# Env overrides:
#   FRONTEND_DIR   — default: <repo>/frontend
#   REPORT         — default: <repo>/docs/testnet/iter12-frontend-env-freeze.md
#   PUBLIC_BASE    — default: https://goodswap.goodclaw.org
#   SKIP_BUILD=1   — re-run only the gate + smoke against existing `.next`.
#
# Tracking:
#   .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
#     0013-iter12-frontend-env-freeze.md
set -u

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
FRONTEND_DIR="${FRONTEND_DIR:-${ROOT_DIR}/frontend}"
NEXT_DIR="${NEXT_DIR:-${FRONTEND_DIR}/.next}"
REPORT="${REPORT:-${ROOT_DIR}/docs/testnet/iter12-frontend-env-freeze.md}"
PUBLIC_BASE="${PUBLIC_BASE:-https://goodswap.goodclaw.org}"
GATE_SCRIPT="${GATE_SCRIPT:-${ROOT_DIR}/scripts/testnet/check-bundle-no-localhost.sh}"

mkdir -p "$(dirname -- "$REPORT")"
TMP="$(mktemp)"
GATE_BEFORE_LOG="$(mktemp)"
GATE_AFTER_LOG="$(mktemp)"
BUILD_LOG="$(mktemp)"
trap 'rm -f "$TMP" "$GATE_BEFORE_LOG" "$GATE_AFTER_LOG" "$BUILD_LOG"' EXIT

stamp()      { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
commit_sha() { git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || echo "unknown"; }

# ---------- 1. BEFORE: gate the existing build (if any) ----------------------

BEFORE_VERDICT="SKIP"
BEFORE_DISALLOWED=0
BEFORE_ALLOWED=0
BEFORE_SCANNED=0

if [ -d "$NEXT_DIR" ] && [ -f "$NEXT_DIR/BUILD_ID" ]; then
  BEFORE_REPORT="${ROOT_DIR}/docs/testnet/iter12-bundle-before.md"
  REPORT="$BEFORE_REPORT" bash "$GATE_SCRIPT" "$NEXT_DIR" >"$GATE_BEFORE_LOG" 2>&1
  BEFORE_RC=$?
  BEFORE_DISALLOWED="$(awk -F'[: ]+' '/disallowed hits:/ {print $4; exit}' "$GATE_BEFORE_LOG" 2>/dev/null || echo 0)"
  BEFORE_ALLOWED="$(awk -F'[: ]+' '/allowed hits:/ {print $4; exit}' "$GATE_BEFORE_LOG" 2>/dev/null || echo 0)"
  BEFORE_SCANNED="$(awk -F'[: ]+' '/files scanned:/ {print $4; exit}' "$GATE_BEFORE_LOG" 2>/dev/null || echo 0)"
  if [ "$BEFORE_RC" -eq 0 ]; then BEFORE_VERDICT="GREEN"; else BEFORE_VERDICT="RED"; fi
fi

# ---------- 2. BUILD: fresh next build (also reloads PM2 via postbuild) ------

BUILD_VERDICT="SKIP"
BUILD_RC=0
BUILD_DURATION="—"

if [ "${SKIP_BUILD:-0}" = "1" ]; then
  echo "[iter12] SKIP_BUILD=1 — skipping fresh build" | tee "$BUILD_LOG"
else
  echo "[iter12] running: cd $FRONTEND_DIR && npm run build" | tee "$BUILD_LOG"
  build_start=$(date +%s)
  ( cd "$FRONTEND_DIR" && npm run build ) >>"$BUILD_LOG" 2>&1
  BUILD_RC=$?
  build_end=$(date +%s)
  BUILD_DURATION="$((build_end - build_start))s"
  if [ "$BUILD_RC" -eq 0 ]; then BUILD_VERDICT="GREEN"; else BUILD_VERDICT="RED"; fi
fi

# ---------- 3. AFTER: gate the fresh build ----------------------------------

AFTER_VERDICT="SKIP"
AFTER_DISALLOWED=0
AFTER_ALLOWED=0
AFTER_SCANNED=0

if [ -d "$NEXT_DIR" ] && [ -f "$NEXT_DIR/BUILD_ID" ]; then
  AFTER_REPORT="${ROOT_DIR}/docs/testnet/iter12-bundle-no-localhost.md"
  REPORT="$AFTER_REPORT" bash "$GATE_SCRIPT" "$NEXT_DIR" >"$GATE_AFTER_LOG" 2>&1
  AFTER_RC=$?
  AFTER_DISALLOWED="$(awk -F'[: ]+' '/disallowed hits:/ {print $4; exit}' "$GATE_AFTER_LOG" 2>/dev/null || echo 0)"
  AFTER_ALLOWED="$(awk -F'[: ]+' '/allowed hits:/ {print $4; exit}' "$GATE_AFTER_LOG" 2>/dev/null || echo 0)"
  AFTER_SCANNED="$(awk -F'[: ]+' '/files scanned:/ {print $4; exit}' "$GATE_AFTER_LOG" 2>/dev/null || echo 0)"
  if [ "$AFTER_RC" -eq 0 ]; then AFTER_VERDICT="GREEN"; else AFTER_VERDICT="RED"; fi
fi

# ---------- 4. SMOKE: fetch the public /testnet-guide page ------------------

SMOKE_VERDICT="SKIP"
SMOKE_STATUS=0
SMOKE_LOCALHOST_HITS=0
SMOKE_RPC_LINE=""

SMOKE_BODY="$(mktemp)"
SMOKE_STATUS="$(curl -sS -o "$SMOKE_BODY" -w '%{http_code}' --max-time 15 \
  "${PUBLIC_BASE}/testnet-guide" 2>/dev/null || echo 000)"

if [ "$SMOKE_STATUS" = "200" ]; then
  # -o emits one match per line; piping to wc -l gives a single integer total.
  SMOKE_LOCALHOST_HITS="$(grep -oE 'localhost|127\.0\.0\.1|0\.0\.0\.0' "$SMOKE_BODY" 2>/dev/null | wc -l | tr -d ' ')"
  SMOKE_LOCALHOST_HITS="${SMOKE_LOCALHOST_HITS:-0}"
  # Pull the RPC row out of the rendered HTML for the report.
  SMOKE_RPC_LINE="$(grep -oE '>https?://[^<]+</td>' "$SMOKE_BODY" 2>/dev/null \
    | head -1 | sed 's/^>//;s/<\/td>$//' || true)"
  if [ "$SMOKE_LOCALHOST_HITS" -eq 0 ] 2>/dev/null; then
    SMOKE_VERDICT="GREEN"
  else
    SMOKE_VERDICT="RED"
  fi
else
  SMOKE_VERDICT="RED"
fi
rm -f "$SMOKE_BODY"

# ---------- 5. Compose the report -------------------------------------------

OVERALL="GREEN"
[ "$AFTER_VERDICT"  != "GREEN" ] && OVERALL="RED"
[ "$BUILD_VERDICT"  = "RED"   ] && OVERALL="RED"
[ "$SMOKE_VERDICT"  = "RED"   ] && OVERALL="RED"

{
  printf '# Iter 12 — Frontend env freeze\n\n'
  printf '_Generated: %s · commit: %s · runner: scripts/testnet/iter12-frontend-env-freeze.sh_\n\n' \
    "$(stamp)" "$(commit_sha)"

  printf '## Verdict: %s\n\n' "$OVERALL"

  printf '| Stage  | Verdict | Detail |\n'
  printf '|--------|---------|--------|\n'
  printf '| Before | %s | disallowed=%s allowed=%s scanned=%s |\n' \
    "$BEFORE_VERDICT" "$BEFORE_DISALLOWED" "$BEFORE_ALLOWED" "$BEFORE_SCANNED"
  printf '| Build  | %s | duration=%s rc=%s |\n' \
    "$BUILD_VERDICT" "$BUILD_DURATION" "$BUILD_RC"
  printf '| After  | %s | disallowed=%s allowed=%s scanned=%s |\n' \
    "$AFTER_VERDICT" "$AFTER_DISALLOWED" "$AFTER_ALLOWED" "$AFTER_SCANNED"
  printf '| Smoke  | %s | %s/testnet-guide status=%s localhost_in_html=%s |\n' \
    "$SMOKE_VERDICT" "$PUBLIC_BASE" "$SMOKE_STATUS" "$SMOKE_LOCALHOST_HITS"
  printf '\n'

  if [ -n "$SMOKE_RPC_LINE" ]; then
    printf '**Live RPC row from /testnet-guide HTML:** `%s`\n\n' "$SMOKE_RPC_LINE"
  fi

  printf '## Stage 1 — Gate before rebuild\n\n'
  printf '```text\n%s\n```\n\n' "$(tail -n 25 "$GATE_BEFORE_LOG" 2>/dev/null || echo '(no before run)')"

  printf '## Stage 2 — `npm run build` tail\n\n'
  printf '```text\n%s\n```\n\n' "$(tail -n 30 "$BUILD_LOG" 2>/dev/null || echo '(no build output)')"

  printf '## Stage 3 — Gate after rebuild\n\n'
  printf '```text\n%s\n```\n\n' "$(tail -n 25 "$GATE_AFTER_LOG" 2>/dev/null || echo '(no after run)')"

  printf '## Stage 4 — Public site smoke\n\n'
  printf '```text\n$ curl -sS -o /dev/null -w %%{http_code} %s/testnet-guide\n%s\n```\n\n' \
    "$PUBLIC_BASE" "$SMOKE_STATUS"

  printf '## Sub-reports\n\n'
  printf -- '- Bundle gate detail (after rebuild): `docs/testnet/iter12-bundle-no-localhost.md`\n'
  if [ "$BEFORE_VERDICT" != "SKIP" ]; then
    printf -- '- Bundle gate detail (before rebuild): `docs/testnet/iter12-bundle-before.md`\n'
  fi
  printf '\n'

  printf '## Source-level fixes\n\n'
  printf -- '- `frontend/src/app/(app)/testnet-guide/page.tsx` — imports canonical RPC/chainID/explorer from `@/lib/devnet`.\n'
  printf -- '- `frontend/src/lib/usePerpsHistory.ts` — empty-string fallback + short-circuit when `NEXT_PUBLIC_INDEXER_URL` is unset.\n'
  printf -- '- `scripts/testnet/check-bundle-no-localhost.sh` — build-artifact gate with content-aware allowlist.\n\n'

  printf '## Re-running locally\n\n'
  printf '```bash\n'
  printf 'bash scripts/testnet/iter12-frontend-env-freeze.sh        # full run (~1-2 min)\n'
  printf 'SKIP_BUILD=1 bash scripts/testnet/iter12-frontend-env-freeze.sh   # gate + smoke only\n'
  printf '```\n'
} > "$TMP"

mv "$TMP" "$REPORT"

# ---------- 6. One-screen terminal summary -----------------------------------

printf '\n=========================================================\n'
printf '  Iter 12 — Frontend env freeze — verdict: %s\n' "$OVERALL"
printf '  before: %-5s (disallowed=%s)\n'        "$BEFORE_VERDICT" "$BEFORE_DISALLOWED"
printf '  build:  %-5s (rc=%s, %s)\n'            "$BUILD_VERDICT" "$BUILD_RC" "$BUILD_DURATION"
printf '  after:  %-5s (disallowed=%s)\n'        "$AFTER_VERDICT"  "$AFTER_DISALLOWED"
printf '  smoke:  %-5s (status=%s, hits=%s)\n'   "$SMOKE_VERDICT"  "$SMOKE_STATUS" "$SMOKE_LOCALHOST_HITS"
printf '  report: %s\n' "$REPORT"
printf '=========================================================\n'

[ "$OVERALL" = "GREEN" ] || exit 1
exit 0
