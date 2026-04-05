#!/usr/bin/env bash
# GoodDollar L2 — Initialize and start the full OP Stack devnet
# Usage: ./init-and-start.sh [--reset]
#
# This replaces the single Anvil node with a proper OP Stack:
#   L1 (Anvil chain 900) → op-node → op-geth (chain 42069) + batcher + proposer
#
# --reset: Wipe all volumes and reinitialize from scratch
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

source .env 2>/dev/null || true

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${CYAN}[op-stack]${NC} $1"; }
ok()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn(){ echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ─── Pre-flight checks ──────────────────────────
command -v docker >/dev/null 2>&1 || err "Docker not found"
command -v docker compose >/dev/null 2>&1 || err "Docker Compose not found"
command -v cast >/dev/null 2>&1 || true  # cast optional, using python3 for RPC checks

# ─── Handle --reset flag ────────────────────────
if [[ "${1:-}" == "--reset" ]]; then
  warn "Resetting all OP Stack volumes and containers..."
  docker compose -f docker-compose.yml down -v --remove-orphans 2>/dev/null || true
  ok "Clean slate"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🟢 GoodDollar L2 — OP Stack Devnet Launcher"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  L1 Chain ID:  ${L1_CHAIN_ID:-900}"
echo "  L2 Chain ID:  ${L2_CHAIN_ID:-42069}"
echo "  L1 RPC:       http://localhost:8546"
echo "  L2 RPC:       http://localhost:9545"
echo ""

# ─── Step 1: Start L1 first ─────────────────────
log "Starting L1 (Anvil)..."
docker compose -f docker-compose.yml up -d l1-anvil
log "Waiting for L1 to be ready..."

for i in $(seq 1 60); do
  if python3 -c "
import urllib.request, json
try:
    req = urllib.request.Request('http://localhost:8546', data=b'{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}', headers={'Content-Type':'application/json'})
    json.loads(urllib.request.urlopen(req, timeout=2).read())
    exit(0)
except: exit(1)
" 2>/dev/null; then
    ok "L1 is live"
    break
  fi
  if [ $i -eq 60 ]; then err "L1 failed to start after 60s"; fi
  sleep 1
done

# ─── Step 2: Deploy L1 contracts if needed ───────
log "Checking L1 contracts..."
L2OO_CODE=$(python3 -c "
import urllib.request, json, os
addr = os.environ.get('L2OO_ADDRESS', '0x0000000000000000000000000000000000000000')
body = json.dumps({'jsonrpc':'2.0','method':'eth_getCode','params':[addr,'latest'],'id':1}).encode()
req = urllib.request.Request('http://localhost:8546', data=body, headers={'Content-Type':'application/json'})
r = json.loads(urllib.request.urlopen(req, timeout=5).read())
print(r.get('result','0x'))
" 2>/dev/null || echo "0x")

if [ "$L2OO_CODE" == "0x" ] || [ -z "$L2OO_CODE" ]; then
  log "L1 contracts not deployed — running deploy-l1.sh..."
  bash deploy-l1.sh
  ok "L1 contracts deployed"
else
  ok "L1 contracts already deployed"
fi

# ─── Step 2b: Capture L1 genesis hash ────────────
log "Getting L1 genesis block hash..."
L1_GENESIS_HASH=$(docker compose -f docker-compose.yml exec -T l1-anvil \
  sh -c 'cast block 0 --rpc-url http://localhost:8545 --json' 2>/dev/null \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['hash'])" 2>/dev/null || echo "")
if [ -z "$L1_GENESIS_HASH" ]; then
  warn "Could not get L1 genesis hash — using zero hash (op-node may fail)"
  L1_GENESIS_HASH="0x0000000000000000000000000000000000000000000000000000000000000000"
else
  ok "L1 genesis hash: $L1_GENESIS_HASH"
fi

# ─── Step 3: op-geth init is handled inline in docker-compose entrypoint ──
log "op-geth genesis init is handled on first container start via docker-compose entrypoint"

# ─── Step 3b: Start op-geth, capture L2 genesis hash ──
log "Starting op-geth to capture L2 genesis hash..."
docker compose -f docker-compose.yml up -d op-geth
for i in $(seq 1 30); do
  if python3 -c "
import urllib.request, json
try:
    req = urllib.request.Request('http://localhost:9545', data=b'{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}', headers={'Content-Type':'application/json'})
    json.loads(urllib.request.urlopen(req,timeout=2).read())
    exit(0)
except: exit(1)
" 2>/dev/null; then
    ok "op-geth is live"
    break
  fi
  if [ $i -eq 30 ]; then warn "op-geth slow to start, proceeding anyway"; fi
  sleep 1
done

L2_GENESIS_HASH=$(python3 -c "
import urllib.request, json
try:
    req = urllib.request.Request('http://localhost:9545',
        data=b'{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBlockByNumber\",\"params\":[\"0x0\",false],\"id\":1}',
        headers={'Content-Type':'application/json'})
    r = json.loads(urllib.request.urlopen(req, timeout=5).read())
    print(r['result']['hash'])
except Exception as e:
    print('0x0000000000000000000000000000000000000000000000000000000000000000')
" 2>/dev/null || echo "0x0000000000000000000000000000000000000000000000000000000000000000")
ok "L2 genesis hash: $L2_GENESIS_HASH"

# ─── Step 3c: Update rollup.json with real hashes ──
log "Updating rollup.json with genesis hashes..."
python3 -c "
import json, os, sys
PORTAL_ADDR = os.environ.get('PORTAL_ADDRESS', '0xe1708FA6bb2844D5384613ef0846F9Bc1e8eC55E')
SYSCFG_ADDR = os.environ.get('SYSTEM_CONFIG_ADDRESS', '0x0aec7c174554AF8aEc3680BB58431F6618311510')
L1_HASH = sys.argv[1]
L2_HASH = sys.argv[2]
with open('rollup.json') as f: r = json.load(f)
r['genesis']['l1']['hash'] = L1_HASH
r['genesis']['l2']['hash'] = L2_HASH
r['deposit_contract_address'] = PORTAL_ADDR
r['l1_system_config_address'] = SYSCFG_ADDR
with open('rollup.json', 'w') as f: json.dump(r, f, indent=2)
print('rollup.json updated')
" "$L1_GENESIS_HASH" "$L2_GENESIS_HASH"
ok "rollup.json updated"

# ─── Step 4: Start all OP Stack components ───────
log "Starting full OP Stack (op-node + batcher + proposer)..."
docker compose -f docker-compose.yml up -d

echo ""
log "Waiting for L2 RPC..."
for i in $(seq 1 60); do
  if python3 -c "
import urllib.request, json
try:
    req = urllib.request.Request('http://localhost:9545', data=b'{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":1}', headers={'Content-Type':'application/json'})
    r = json.loads(urllib.request.urlopen(req, timeout=2).read())
    print(r['result'])
    exit(0)
except: exit(1)
" 2>/dev/null; then
    ok "L2 is live!"
    break
  fi
  if [ $i -eq 60 ]; then
    warn "L2 not responding after 60s — check: docker compose logs op-geth"
  fi
  sleep 1
done

# ─── Step 5: Health check ────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  📊 Health Check"
echo "═══════════════════════════════════════════════════════════"

L1_BLOCK=$(python3 -c "
import urllib.request, json
try:
    req = urllib.request.Request('http://localhost:8546', data=b'{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}', headers={'Content-Type':'application/json'})
    r = json.loads(urllib.request.urlopen(req, timeout=3).read())
    print(int(r['result'], 16))
except: print('?')
" 2>/dev/null || echo "?")
L2_BLOCK=$(python3 -c "
import urllib.request, json
try:
    req = urllib.request.Request('http://localhost:9545', data=b'{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}', headers={'Content-Type':'application/json'})
    r = json.loads(urllib.request.urlopen(req, timeout=3).read())
    print(int(r['result'], 16))
except: print('?')
" 2>/dev/null || echo "?")
L2_BALANCE="(see op-geth)"

echo "  L1 block:      $L1_BLOCK"
echo "  L2 block:      $L2_BLOCK"
echo "  Deployer ETH:  $L2_BALANCE"
echo ""
echo "  Services:"
docker compose -f docker-compose.yml ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || docker compose -f docker-compose.yml ps
echo ""

# ─── Step 6: Next steps ─────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo "  🚀 Next Steps"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  1. Migrate contracts:  bash migrate.sh"
echo "  2. Update frontend:    Edit frontend/.env.local → RPC=http://localhost:9545"
echo "  3. Run Blockscout:     Point to L2 at localhost:9545"
echo "  4. Monitor:            docker compose logs -f op-node"
echo ""
echo "  Stop:   docker compose -f docker-compose.yml down"
echo "  Reset:  $0 --reset"
echo ""
