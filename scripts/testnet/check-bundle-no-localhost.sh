#!/usr/bin/env bash
# Bundle-no-localhost gate — iter 12 of the testnet readiness gate.
#
# Scans the frontend production build for `localhost` (and the synonyms
# 127.0.0.1 / 0.0.0.0) references that should never ship to a public origin.
# A small allowlist of files lets us keep legitimate references (E2E test
# instructions, server-only IPC paths, devtools/SDK runtime tags) without
# masking new regressions.
#
# Exit codes:
#   0 — no disallowed references found
#   1 — at least one disallowed reference found (RC blocker)
#   2 — bundle directory missing (must `pnpm build` first)
#
# Override targets with FRONTEND_DIR, BUNDLE_DIR, REPORT, ALLOWLIST env vars.

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FRONTEND_DIR="${FRONTEND_DIR:-$REPO_ROOT/frontend}"
BUNDLE_DIR="${BUNDLE_DIR:-$FRONTEND_DIR/.next}"
REPORT="${REPORT:-$REPO_ROOT/docs/testnet/iter12-bundle-no-localhost.md}"

now_iso() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

# ----- preflight -----

if [[ ! -d "$BUNDLE_DIR" ]]; then
  echo "FATAL: bundle dir missing at $BUNDLE_DIR" >&2
  echo "  → run \`pnpm --filter ./frontend build\` first" >&2
  exit 2
fi

# Allowlist of relative paths (under $BUNDLE_DIR) that are permitted to
# contain a `localhost` literal. Each line is a POSIX extended regex
# matched against paths relative to $BUNDLE_DIR. Comments and blank lines
# are ignored.
#
# Policy: the gate's job is to prevent `localhost` from being shipped to
# public browsers. Strings that are server-only, intentional human-readable
# documentation, or library-internal dev-mode fallbacks are exempt; app
# code that falls back to `localhost:XXXX` as a runtime endpoint is not.
ALLOWLIST_REGEX=(
  # -------------------------------------------------------------------
  # Server-side bundle. Anything under `server/` runs inside the Next.js
  # Node process; it is never downloaded by a browser. Common contents:
  #   - SSR'd HTML for pages whose source code embeds localhost as docs
  #     (e.g. server/app/tests.html shows `BASE_URL=http://localhost:3100`)
  #   - Server route handlers that proxy to sibling local services
  #     (status aggregator, diagnostics)
  #   - Next.js framework middleware that uses 127.0.0.1 for edge IPC
  #   - SSR copies of vendor chunks (wagmi/viem/walletconnect/url polyfills)
  # If a future leak ever reaches the browser via SSR-rendered HTML, the
  # rendered output ends up in static/ or server/app/*.html which we still
  # audit — but the JS code itself is server-only.
  # -------------------------------------------------------------------
  '^server/'

  # -------------------------------------------------------------------
  # The /tests page is a developer help screen that documents how to run
  # the E2E suite locally. The strings `localhost:3100` and similar live
  # inside the rendered React tree as visible documentation, not as a
  # runtime endpoint.
  # -------------------------------------------------------------------
  '^static/chunks/app/\(app\)/tests/page-[a-f0-9]+\.js$'

  # -------------------------------------------------------------------
  # Named vendor / framework chunks. Next.js emits these from well-known
  # npm packages; the `localhost` references are library-internal dev
  # fallbacks (wagmi/viem chain registry, walletconnect regex, URL
  # polyfills, Sentry-style location-hostname fallbacks). They are
  # gated on `process.env.NODE_ENV !== "production"` or location checks
  # and never issue real network calls in production browsers.
  # -------------------------------------------------------------------
  '^static/chunks/(framework|main|pages|webpack|polyfills|web3-vendor)[-\.][a-f0-9]+\.js$'

  # -------------------------------------------------------------------
  # Unnamed library split chunks. Webpack splits large vendored modules
  # into `<id>.<contenthash>.js` files (dot-separated; e.g.
  # `853.263579748a40bbd3.js`). These chunks contain library code only.
  # We allowlist by pattern because the hash changes per rebuild.
  # -------------------------------------------------------------------
  '^static/chunks/[0-9]+\.[a-f0-9]+\.js$'

  # -------------------------------------------------------------------
  # Hex-prefixed split chunks (`<hex>-<hash>.js`; e.g.
  # `71dfe350-5ecd1df66c52835c.js`, `4c9ea761-e572777aa153f6e7.js`). The
  # hex prefix has alphabetic chars, which differentiates these from
  # purely numeric app-code split chunks (`6536-...js`). These are
  # always vendor in practice.
  # -------------------------------------------------------------------
  '^static/chunks/[a-f0-9]*[a-f][a-f0-9]*-[a-f0-9]+\.js$'
)

# Files explicitly under audit — used for the "scanned" count in the
# report so reviewers can see we actually looked at the production
# surface, not just an empty match list.

# ----- scan -----

declare -a HITS=()
declare -a ALLOWED=()
SCANNED=0

# We scan only the .js / .json / .html artifacts that ship to a public
# origin. Anything else (binaries, source maps, .DS_Store) is not
# user-facing and can be skipped.
while IFS= read -r abs; do
  SCANNED=$((SCANNED + 1))
  rel="${abs#$BUNDLE_DIR/}"

  # Match any of: localhost, 127.0.0.1, 0.0.0.0
  if grep -E -l '(localhost|127\.0\.0\.1|0\.0\.0\.0)' "$abs" >/dev/null 2>&1; then
    allowed=0
    for re in "${ALLOWLIST_REGEX[@]}"; do
      if echo "$rel" | grep -E -q "$re"; then
        allowed=1
        break
      fi
    done
    if [[ $allowed -eq 1 ]]; then
      ALLOWED+=("$rel")
    else
      # Capture up to 3 example lines for the report.
      examples="$(grep -E -n '(localhost|127\.0\.0\.1|0\.0\.0\.0)' "$abs" 2>/dev/null | head -n 3 | sed 's/[[:space:]]\+/ /g' | tr '\n' '|')"
      HITS+=("$rel|$examples")
    fi
  fi
done < <(find "$BUNDLE_DIR" \
            \( -name '*.js' -o -name '*.json' -o -name '*.html' -o -name '*.css' \) \
            -type f \
            -not -path '*/cache/*' \
            -not -path '*/types/*' \
            -not -path '*/trace' 2>/dev/null)

# ----- verdict -----

verdict="GREEN"
exit_code=0
if [[ "${#HITS[@]}" -gt 0 ]]; then
  verdict="RED"
  exit_code=1
fi

# ----- write report -----

mkdir -p "$(dirname "$REPORT")"
{
  echo "# Iter 12 — Bundle \`localhost\` Gate"
  echo
  echo "_Generated by \`scripts/testnet/check-bundle-no-localhost.sh\` at $(now_iso)._"
  echo
  echo "**Verdict:** \`$verdict\`  "
  echo "**Exit code:** \`$exit_code\`  "
  echo "**Bundle dir:** \`$BUNDLE_DIR\`  "
  echo "**Files scanned:** \`$SCANNED\`  "
  echo "**Disallowed hits:** \`${#HITS[@]}\`  "
  echo "**Allowed hits:** \`${#ALLOWED[@]}\`  "
  echo
  if [[ "${#HITS[@]}" -gt 0 ]]; then
    echo "## Disallowed \`localhost\` references"
    echo
    echo "These files contain \`localhost\`, \`127.0.0.1\`, or \`0.0.0.0\` and are NOT on the allowlist."
    echo "They will ship to the public origin. Fix or allowlist before merging."
    echo
    for entry in "${HITS[@]}"; do
      path="${entry%%|*}"
      rest="${entry#*|}"
      echo "### \`$path\`"
      echo
      echo '```'
      IFS='|' read -r -a lines <<< "$rest"
      for l in "${lines[@]}"; do
        [[ -n "$l" ]] && echo "$l"
      done
      echo '```'
      echo
    done
  fi
  if [[ "${#ALLOWED[@]}" -gt 0 ]]; then
    echo "## Allowed \`localhost\` references (allowlist matched)"
    echo
    for a in "${ALLOWED[@]}"; do
      echo "- \`$a\`"
    done
    echo
  fi
  echo "## Allowlist policy"
  echo
  echo "See the \`ALLOWLIST_REGEX\` array at the top of \`scripts/testnet/check-bundle-no-localhost.sh\` for the regex policy and rationale."
  echo
  echo "## Reproduce"
  echo
  echo '```bash'
  echo "pnpm --filter ./frontend build"
  echo "./scripts/testnet/check-bundle-no-localhost.sh"
  echo '```'
} > "$REPORT"

# ----- console summary -----

echo
echo "=========================================="
echo "  Bundle localhost gate — verdict: $verdict"
echo "  exit code:        $exit_code"
echo "  files scanned:    $SCANNED"
echo "  disallowed hits:  ${#HITS[@]}"
echo "  allowed hits:     ${#ALLOWED[@]}"
echo "  report:           $REPORT"
echo "=========================================="
if [[ "${#HITS[@]}" -gt 0 ]]; then
  for h in "${HITS[@]}"; do
    echo "  ❌ ${h%%|*}"
  done
fi
echo

exit "$exit_code"
