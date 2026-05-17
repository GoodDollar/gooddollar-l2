#!/usr/bin/env bash
# Testnet health gate — iter 2 of the testnet readiness gate.
#
# Reads docs/testnet/HEALTH-CONTRACT.md as the source of truth for which
# /api/status services must be `ok` (REQUIRED) and which are knowingly
# degraded (EXCLUDED). Probes the public surfaces, prints a 1-screen
# summary, writes a Markdown report, and exits 1 on any blocker.
#
# Notes:
#   - Pure bash. `set -u` only — `set -e` is intentionally OFF so probes
#     keep going when one fails, which is the whole point of a health gate.
#   - JSON parsing goes through `node -e` to avoid taking a `jq` dependency.
#   - Override targets with PUBLIC_BASE, PUBLIC_RPC, REPORT env vars.

set -u

PUBLIC_BASE="${PUBLIC_BASE:-https://goodswap.goodclaw.org}"
PUBLIC_RPC="${PUBLIC_RPC:-https://rpc.goodclaw.org}"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ADDRESSES="${ADDRESSES:-$REPO_ROOT/op-stack/addresses.json}"
HEALTH_CONTRACT="${HEALTH_CONTRACT:-$REPO_ROOT/docs/testnet/HEALTH-CONTRACT.md}"
REPORT="${REPORT:-$REPO_ROOT/docs/testnet/iter02-health-gate.md}"

# ----- helpers -----

now_iso() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

http_status() {
  curl -k -sS -o /dev/null -w '%{http_code}' --max-time 10 "$1" 2>/dev/null \
    || echo 000
}

# Extract markdown table column 1 entries (service names) from a section of
# HEALTH-CONTRACT.md. Section is identified by its `## ` heading prefix.
contract_services() {
  local section_marker="$1"
  awk -v marker="$section_marker" '
    BEGIN { in_section=0; in_table=0 }
    /^## / {
      in_section = (index($0, marker) > 0) ? 1 : 0
      in_table = 0
      next
    }
    in_section && /^\| *`[a-zA-Z0-9_-]+` *\|/ {
      # parse first column, strip backticks and whitespace
      n = split($0, parts, "|")
      gsub(/[ `]/, "", parts[2])
      if (parts[2] != "service") print parts[2]
    }
  ' "$HEALTH_CONTRACT"
}

# ----- preflight -----

if [[ ! -f "$HEALTH_CONTRACT" ]]; then
  echo "FATAL: health contract missing at $HEALTH_CONTRACT" >&2
  exit 2
fi
if ! command -v node >/dev/null 2>&1; then
  echo "FATAL: node is required for JSON parsing" >&2
  exit 2
fi

mapfile -t REQUIRED < <(contract_services "Required services in")
mapfile -t EXCLUDED < <(contract_services "Documented exclusions")

if [[ "${#REQUIRED[@]}" -eq 0 ]]; then
  echo "FATAL: could not parse Required services from $HEALTH_CONTRACT" >&2
  exit 2
fi

# ----- probes -----

declare -a BLOCKERS=()
declare -a WARNINGS=()
declare -a SUMMARY_LINES=()

add_summary() { SUMMARY_LINES+=("$1"); }

# 1. Required public pages
PAGES=(
  "/"
  "/faucet"
  "/perps"
  "/portfolio"
  "/tests"
  "/testnet-guide"
)
add_summary ""
add_summary "## Public pages"
add_summary ""
add_summary "| path | status |"
add_summary "|------|--------|"
for path in "${PAGES[@]}"; do
  code="$(http_status "$PUBLIC_BASE$path")"
  if [[ "$code" == "200" ]]; then
    add_summary "| \`$path\` | ✅ 200 |"
  else
    add_summary "| \`$path\` | ❌ $code |"
    BLOCKERS+=("page $path returned $code")
  fi
done

# 2. /api/status reachable + parseable
add_summary ""
add_summary "## /api/status"
add_summary ""
status_body="$(curl -k -sS --max-time 15 "$PUBLIC_BASE/api/status" 2>/dev/null || true)"
if [[ -z "$status_body" ]]; then
  add_summary "❌ \`/api/status\` returned empty body"
  BLOCKERS+=("/api/status empty")
else
  parsed="$(node -e '
    let raw = "";
    process.stdin.on("data", c => raw += c);
    process.stdin.on("end", () => {
      try {
        const j = JSON.parse(raw);
        if (!Array.isArray(j.services)) { console.log("BAD"); return; }
        const out = j.services.map(s => `${s.name}\t${s.status||"?"}`).join("\n");
        console.log("OK");
        console.log(`OVERALL\t${j.overall||"?"}`);
        console.log(`HEALTHY\t${j.healthy||0}/${j.total||0}`);
        console.log(out);
      } catch (e) { console.log("BAD"); }
    });
  ' <<<"$status_body" 2>/dev/null)"

  first_line="$(printf "%s\n" "$parsed" | head -n 1)"
  if [[ "$first_line" != "OK" ]]; then
    add_summary "❌ \`/api/status\` did not parse as JSON with \`services[]\`"
    BLOCKERS+=("/api/status not parseable")
  else
    overall="$(printf "%s\n" "$parsed" | awk -F'\t' '$1=="OVERALL"{print $2}')"
    healthy="$(printf "%s\n" "$parsed" | awk -F'\t' '$1=="HEALTHY"{print $2}')"
    add_summary "Overall: \`$overall\` — healthy $healthy"
    add_summary ""
    add_summary "| service | status | classification |"
    add_summary "|---------|--------|----------------|"

    # Build name->status map
    declare -A SVC_STATUS=()
    while IFS=$'\t' read -r name status; do
      [[ -z "$name" || "$name" == "OK" || "$name" == "OVERALL" || "$name" == "HEALTHY" ]] && continue
      SVC_STATUS[$name]="$status"
    done < <(printf "%s\n" "$parsed")

    # Required services must be ok
    for svc in "${REQUIRED[@]}"; do
      st="${SVC_STATUS[$svc]:-MISSING}"
      if [[ "$st" == "ok" ]]; then
        add_summary "| \`$svc\` | $st | ✅ REQUIRED |"
      else
        add_summary "| \`$svc\` | $st | ❌ REQUIRED BLOCKER |"
        BLOCKERS+=("required service $svc is $st (must be ok)")
      fi
    done

    # Excluded services — warn only
    for svc in "${EXCLUDED[@]}"; do
      st="${SVC_STATUS[$svc]:-MISSING}"
      if [[ "$st" == "ok" ]]; then
        add_summary "| \`$svc\` | $st | 🟢 EXCLUDED-but-ok |"
      else
        add_summary "| \`$svc\` | $st | ⚠️  EXCLUDED |"
        WARNINGS+=("excluded service $svc is $st")
      fi
    done

    # Surface anything in /api/status not covered by REQUIRED or EXCLUDED.
    for svc in "${!SVC_STATUS[@]}"; do
      covered=0
      for r in "${REQUIRED[@]}"; do [[ "$r" == "$svc" ]] && covered=1; done
      for e in "${EXCLUDED[@]}"; do [[ "$e" == "$svc" ]] && covered=1; done
      if [[ $covered -eq 0 ]]; then
        st="${SVC_STATUS[$svc]}"
        add_summary "| \`$svc\` | $st | ⚠️  UNCLASSIFIED |"
        WARNINGS+=("service $svc is not in REQUIRED or EXCLUDED — classify it in HEALTH-CONTRACT.md")
      fi
    done
  fi
fi

# 3. Chain advancing
add_summary ""
add_summary "## Public RPC"
add_summary ""

rpc_block() {
  curl -k -sS --max-time 10 -X POST -H 'Content-Type: application/json' \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    "$PUBLIC_RPC" 2>/dev/null \
    | node -e '
        let raw=""; process.stdin.on("data",c=>raw+=c);
        process.stdin.on("end",()=>{ try{ const j=JSON.parse(raw); console.log(parseInt(j.result,16)||0);} catch(e){console.log(0);} });
      ' 2>/dev/null
}

block1="$(rpc_block)"
block1="${block1:-0}"
sleep 7
block2="$(rpc_block)"
block2="${block2:-0}"

if [[ "$block1" -le 0 || "$block2" -le 0 ]]; then
  add_summary "❌ RPC \`$PUBLIC_RPC\` did not return a block number (got $block1, $block2)"
  BLOCKERS+=("public RPC unreachable")
elif [[ "$block2" -le "$block1" ]]; then
  add_summary "❌ Chain not advancing — block stayed at \`$block1\` then \`$block2\` over ≥ 7 s"
  BLOCKERS+=("chain not advancing ($block1 → $block2)")
else
  delta=$((block2 - block1))
  add_summary "✅ Chain advancing: \`$block1\` → \`$block2\` (+$delta over ≥ 7 s)"
fi

# 4. addresses.json sanity
add_summary ""
add_summary "## op-stack/addresses.json"
add_summary ""
if [[ ! -f "$ADDRESSES" ]]; then
  add_summary "❌ \`$ADDRESSES\` is missing"
  BLOCKERS+=("addresses.json missing")
else
  count="$(node -e '
    const fs=require("fs");
    try {
      const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
      const c=j.contracts||{};
      const n=Object.values(c).filter(v=>typeof v==="string"&&/^0x[0-9a-fA-F]{40}$/.test(v)).length;
      console.log(n);
    } catch(e){ console.log(-1); }
  ' "$ADDRESSES" 2>/dev/null)"
  if [[ "$count" -lt 1 ]]; then
    add_summary "❌ \`addresses.json\` did not parse as JSON with ≥ 1 contract address"
    BLOCKERS+=("addresses.json invalid or empty")
  else
    add_summary "✅ \`addresses.json\` has $count valid contract addresses"
  fi
fi

# ----- verdict -----

verdict="GREEN"
exit_code=0
if [[ "${#BLOCKERS[@]}" -gt 0 ]]; then
  verdict="RED"
  exit_code=1
elif [[ "${#WARNINGS[@]}" -gt 0 ]]; then
  verdict="GREEN-with-warnings"
fi

# ----- write report -----

mkdir -p "$(dirname "$REPORT")"
{
  echo "# Iter 2 — Health Gate Run"
  echo
  echo "_Generated by \`scripts/testnet/health-gate.sh\` at $(now_iso)._"
  echo
  echo "**Verdict:** \`$verdict\`  "
  echo "**Exit code:** \`$exit_code\`  "
  echo "**Public base:** \`$PUBLIC_BASE\`  "
  echo "**Public RPC:** \`$PUBLIC_RPC\`  "
  echo
  echo "Source of truth: [\`docs/testnet/HEALTH-CONTRACT.md\`](./HEALTH-CONTRACT.md)."
  echo
  if [[ "${#BLOCKERS[@]}" -gt 0 ]]; then
    echo "## Blockers"
    echo
    for b in "${BLOCKERS[@]}"; do echo "- ❌ $b"; done
    echo
  fi
  if [[ "${#WARNINGS[@]}" -gt 0 ]]; then
    echo "## Warnings (documented exclusions still flapping)"
    echo
    for w in "${WARNINGS[@]}"; do echo "- ⚠️  $w"; done
    echo
  fi
  for line in "${SUMMARY_LINES[@]}"; do
    echo "$line"
  done
  echo
  echo "## Reproduce"
  echo
  echo '```bash'
  echo "./scripts/testnet/health-gate.sh"
  echo '```'
} > "$REPORT"

# ----- console summary -----

echo
echo "=========================================="
echo "  Testnet health gate — verdict: $verdict"
echo "  exit code: $exit_code"
echo "  blockers:  ${#BLOCKERS[@]}"
echo "  warnings:  ${#WARNINGS[@]}"
echo "  report:    $REPORT"
echo "=========================================="
if [[ "${#BLOCKERS[@]}" -gt 0 ]]; then
  printf '  ❌ %s\n' "${BLOCKERS[@]}"
fi
if [[ "${#WARNINGS[@]}" -gt 0 ]]; then
  printf '  ⚠️  %s\n' "${WARNINGS[@]}"
fi
echo

exit "$exit_code"
