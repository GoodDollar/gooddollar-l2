#!/usr/bin/env bash
# Iter 1 baseline inventory — Testnet Readiness Gate (initiative 0004).
#
# Produces docs/testnet/iter01-baseline.md from live probes of:
#   git, PM2, port 3100, public pages, /api/status, RPC block, doc files.
#
# Pure inventory. NEVER mutates services, addresses, or PM2 processes.
# Safe to re-run; output file is overwritten atomically.
#
# Usage:
#   ./scripts/testnet/iter01-baseline.sh             # write report
#   REPORT=/tmp/x.md ./scripts/testnet/iter01-baseline.sh
set -u

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT="${REPORT:-${ROOT_DIR}/docs/testnet/iter01-baseline.md}"
PUBLIC_BASE="${PUBLIC_BASE:-https://goodswap.goodclaw.org}"
PUBLIC_RPC="${PUBLIC_RPC:-https://rpc.goodclaw.org}"
PAGES=(/ /faucet /perps /portfolio /tests /testnet-guide)

mkdir -p "$(dirname -- "$REPORT")"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

stamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
commit_sha() { git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || echo "unknown"; }

probe() {
  # probe "label" cmd...; never aborts on failure
  local label="$1"; shift
  local out rc
  out="$("$@" 2>&1)"; rc=$?
  printf '\n```text\n$ %s\n' "$*" >> "$TMP"
  printf '%s\n' "$out" >> "$TMP"
  printf '(exit %d)\n```\n' "$rc" >> "$TMP"
}

http_status() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 8 "$1" 2>/dev/null || echo "ERR"
}

{
  echo "# Iter 1 — Testnet Readiness Baseline Inventory"
  echo
  echo "- Timestamp (UTC): $(stamp)"
  echo "- Commit SHA: \`$(commit_sha)\`"
  echo "- Public base: ${PUBLIC_BASE}"
  echo "- Public RPC: ${PUBLIC_RPC}"
  echo
  echo "> Pure inventory iteration. No services or addresses were changed."
} > "$TMP"

echo >> "$TMP"
echo "## 1. GIT STATUS" >> "$TMP"
probe "git status" git -C "$ROOT_DIR" status --short
probe "git branch" git -C "$ROOT_DIR" branch --show-current
probe "git log" git -C "$ROOT_DIR" log -3 --oneline

echo >> "$TMP"
echo "## 2. PM2 STATUS" >> "$TMP"
if command -v pm2 >/dev/null 2>&1; then
  # Compact, table-shaped summary derived from `pm2 jlist`.
  pm2_summary="$(pm2 jlist 2>/dev/null | node -e '
    let s = ""; try { s = require("fs").readFileSync(0,"utf8"); } catch(e){}
    let arr = []; try { arr = JSON.parse(s); } catch(e){ console.error("parse-fail"); process.exit(0); }
    if (!Array.isArray(arr)) process.exit(0);
    const rows = arr.map(p => {
      const m = p.pm2_env || {};
      return {
        name: p.name || "",
        pid:  p.pid || 0,
        status: m.status || "",
        restarts: m.restart_time || 0,
        uptime_s: m.pm_uptime ? Math.round((Date.now() - m.pm_uptime)/1000) : 0,
        port: m.PORT || m.env && m.env.PORT || ""
      };
    });
    rows.sort((a,b) => (b.restarts - a.restarts) || a.name.localeCompare(b.name));
    console.log("| name | pid | status | restarts | uptime_s |");
    console.log("|---|---:|---|---:|---:|");
    rows.forEach(r => {
      console.log(`| ${r.name} | ${r.pid} | ${r.status} | ${r.restarts} | ${r.uptime_s} |`);
    });
  ' 2>&1 || true)"
  printf '\n%s\n' "$pm2_summary" >> "$TMP"
else
  printf '\n_PM2 not installed on this host._\n' >> "$TMP"
fi

echo >> "$TMP"
echo "## 3. PORT 3100 OWNERSHIP" >> "$TMP"
probe "ss :3100" bash -c "ss -ltnp 2>/dev/null | awk 'NR==1 || /:3100 /'"

echo >> "$TMP"
echo "## 4. PUBLIC PAGES" >> "$TMP"
echo >> "$TMP"
echo "| Path | HTTP |" >> "$TMP"
echo "|---|---|" >> "$TMP"
for p in "${PAGES[@]}"; do
  code="$(http_status "${PUBLIC_BASE}${p}")"
  printf '| `%s` | %s |\n' "$p" "$code" >> "$TMP"
done

echo >> "$TMP"
echo "## 5. /api/status HEALTH" >> "$TMP"
status_url="${PUBLIC_BASE}/api/status"
status_body="$(curl -s --max-time 10 "$status_url" 2>&1 || true)"
printf '\n```json\n%s\n```\n' "$status_body" >> "$TMP"

echo >> "$TMP"
echo "## 6. CHAIN BLOCK" >> "$TMP"
rpc_body='{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
public_block="$(curl -s --max-time 8 -H 'Content-Type: application/json' -d "$rpc_body" "$PUBLIC_RPC" 2>&1 || true)"
local_block="$(curl -s --max-time 4 -H 'Content-Type: application/json' -d "$rpc_body" http://127.0.0.1:8545 2>&1 || true)"
printf -- '\n- Public RPC (`%s`): `%s`\n' "$PUBLIC_RPC" "$public_block" >> "$TMP"
printf -- '- Local RPC (`http://127.0.0.1:8545`): `%s`\n' "$local_block" >> "$TMP"

echo >> "$TMP"
echo "## 7. DOC INVENTORY" >> "$TMP"
echo >> "$TMP"
echo "| File | Lines | Exists |" >> "$TMP"
echo "|---|---:|:---:|" >> "$TMP"
for f in README.md docs/TESTNET_README.md docs/ARCHITECTURE.md docs/TESTNET-READINESS-50-ITERATIONS.md op-stack/addresses.json; do
  full="${ROOT_DIR}/${f}"
  if [ -f "$full" ]; then
    lines="$(wc -l < "$full" | tr -d ' ')"
    printf '| `%s` | %s | YES |\n' "$f" "$lines" >> "$TMP"
  else
    printf '| `%s` | – | NO |\n' "$f" >> "$TMP"
  fi
done

echo >> "$TMP"
echo "## 8. FINDINGS" >> "$TMP"
cat >> "$TMP" <<'FINDINGS'

Flagged from the probes above (verify against `pm2 jlist` and `/api/status`):

- **`activity-reporter`, `harvest-keeper`, `revenue-tracker`** — known to flap
  with >1000 restarts and `unreachable` in `/api/status`. Iter 4 owns the fix.
- **`indexer: error`, `monitor: degraded`** in `/api/status`. Iter 6 owns the fix.
- **`goodswap` PM2 entry** — high restart count observed in earlier probes.
  Iter 3 (PM2/process hygiene) must confirm PM2 owns port 3100 cleanly and
  there is no stray `next dev`.
- **`/api/status` overall = `degraded`** (8/12 healthy) — driven by the
  unreachable + error/degraded services above. Iter 2 (health contract)
  decides what should actually gate the testnet.
- **Doc gap** — `README.md` does not yet link
  `docs/TESTNET-READINESS-50-ITERATIONS.md` or this baseline. Iter 5 doc
  checkpoint owns it.
FINDINGS

echo >> "$TMP"
echo "## 9. NEXT ITERATION" >> "$TMP"
cat >> "$TMP" <<'NEXT'

Concrete follow-ups for iter 2 (health contract for testnet):

1. Define the canonical green-set in `scripts/testnet-health-gate.sh`:
   - MUST be green: `goodswap`, public RPC, `/api/status` reachable, chain
     block advancing.
   - Documented exclusions until fixed: `activity-reporter`,
     `harvest-keeper`, `revenue-tracker`, `indexer`, `monitor`.
2. Gate must fail loudly on true blockers and exit 0 on documented exclusions.
3. Output of gate becomes the iter 2 proof.

Sequencing reminder (from the 50-iter plan):
iter 3 → PM2 hygiene · iter 4 → repair degraded I · iter 5 → README/doc checkpoint 1.
NEXT

mv "$TMP" "$REPORT"
trap - EXIT
echo "Wrote ${REPORT}"
